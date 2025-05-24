import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { addLender, bulkUploadLenders } from '@/services/lender-service';
import { processCsvFile, processPdfFile, processWordFile } from '@/lib/ai/extractLenderData';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Check if request is multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV, PDF, DOC, and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    // Process the file based on its type
    let extractedData: { data: any[]; newColumns: string[] };
    
    // Create a stream to send progress updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Start processing in the background
    (async () => {
      try {
        // Send initial progress
        await writer.write(encoder.encode('data: ' + JSON.stringify({ status: 'processing', progress: 10 }) + '\n\n'));
        
        // Process file based on type
        if (file.type === 'text/csv') {
          extractedData = await processCsvFile(file);
        } else if (file.type === 'application/pdf') {
          extractedData = await processPdfFile(file);
        } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          extractedData = await processWordFile(file);
        } else {
          throw new Error('Unsupported file type');
        }
        
        // Send processing progress
        await writer.write(encoder.encode('data: ' + JSON.stringify({ status: 'processing', progress: 50 }) + '\n\n'));
        
        // Validate and prepare lenders data
        const validLenders = [];
        const errors = [];
        
        for (let i = 0; i < extractedData.data.length; i++) {
          const lender = extractedData.data[i];
          
          try {
            // Basic validation
            if (!lender.name) {
              throw new Error('Name is required');
            }
            
            // Ensure required fields have default values
            const lenderData = {
              name: lender.name,
              description: lender.description || '',
              interestRate: lender.interestRate || 0,
              maxLoanAmount: lender.maxLoanAmount || 0,
              minCreditScore: lender.minCreditScore || 0,
              logoUrl: lender.logoUrl || '',
              website: lender.website || '',
              contactEmail: lender.contactEmail || '',
              isActive: lender.isActive !== undefined ? lender.isActive : true,
              countries: Array.isArray(lender.countries) ? lender.countries : [],
              // Include any additional fields
              ...Object.fromEntries(
                Object.entries(lender).filter(
                  ([key]) => !['name', 'description', 'interestRate', 'maxLoanAmount', 
                              'minCreditScore', 'logoUrl', 'website', 'contactEmail', 
                              'isActive', 'countries'].includes(key)
                )
              )
            };
            
            validLenders.push(lenderData);
          } catch (error: any) {
            errors.push({
              row: i + 1,
              error: error.message || 'Invalid lender data'
            });
          }
        }
        
        // Save to database
        let saveResult;
        if (validLenders.length > 0) {
          saveResult = await bulkUploadLenders(validLenders);
        } else {
          saveResult = { success: 0, failed: 0, errors: [] };
        }
        
        // Combine validation errors with save errors
        const allErrors = [...errors, ...(saveResult.errors || [])];
        
        // Send completion
        await writer.write(
          encoder.encode(
            'data: ' +
              JSON.stringify({
                status: 'completed',
                progress: 100,
                message: `Processed ${validLenders.length} lenders successfully`,
                processed: validLenders.length,
                failed: errors.length,
                newColumns: extractedData.newColumns,
                errors: allErrors.length > 0 ? allErrors : undefined,
              }) +
              '\n\n'
          )
        );
      } catch (error) {
        console.error('Error processing file:', error);
        await writer.write(
          encoder.encode(
            'data: ' +
              JSON.stringify({
                status: 'error',
                progress: 0,
                message: 'Failed to process file',
                error: error instanceof Error ? error.message : 'Unknown error',
              }) +
              '\n\n'
          )
        );
      } finally {
        await writer.close();
      }
    })();

    // Return the stream as the response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in upload handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
