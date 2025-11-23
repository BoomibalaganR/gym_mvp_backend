import csv from 'csv-parser';
import httpStatus from 'http-status';
import stream from 'stream';
import ApiError from '../../../utils/ApiError';
import Member from './member.model';

export class CSVMemberService {
  async batchCreate(gym, user, file, payload) {
    if (!file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'CSV file is required');
    }

    // Parse CSV and get validation results
    const parseResult = await this.parseCSV(file.buffer);
    
    // If there are invalid rows, return them immediately without processing
    if (parseResult.invalidMembers.length > 0) {
      return {
        status: 'validation_failed',
        totalRows: parseResult.totalRows,
        validRows: parseResult.validMembers.length,
        invalidRows: parseResult.invalidMembers.length,
        invalidMembers: parseResult.invalidMembers,
        message: 'CSV contains invalid data. Please fix the errors and try again.'
      };
    }

    // If all rows are valid, proceed with batch creation
    const results = {
      status: 'success',
      total: parseResult.validMembers.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process in batches for better performance
    const BATCH_SIZE = 50;
    for (let i = 0; i < parseResult.validMembers.length; i += BATCH_SIZE) {
      const batch = parseResult.validMembers.slice(i, i + BATCH_SIZE);
      const batchResults = await this.processBatch(gym, batch, i + 1);
      
      results.successful += batchResults.successful;
      results.failed += batchResults.failed;
      results.errors.push(...batchResults.errors);
    }

    return results;
  }

  async parseCSV(csvBuffer) {
    return new Promise((resolve, reject) => {
      const results = {
        validMembers: [],
        invalidMembers: [],
        totalRows: 0
      };

      const readableStream = new stream.Readable();
      readableStream.push(csvBuffer);
      readableStream.push(null);

      let rowNumber = 0;

      readableStream
        .pipe(csv())
        .on('data', (data) => {
          rowNumber++;
          results.totalRows++;
          
          // Clean CSV data
          const memberData = this.cleanCSVData(data);
          
          // Validate the row
          const validation = this.validateMemberData(memberData, rowNumber);
          
          if (validation.isValid) {
            results.validMembers.push(memberData);
          } else {
            results.invalidMembers.push({
              row: rowNumber,
              data: memberData,
              errors: validation.errors
            });
          }
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  validateMemberData(data, rowNumber) {
    const errors = [];
    
    // Required field validation
    if (!data.first_name || data.first_name.trim() === '') {
      errors.push('First name is required');
    } else if (data.first_name.length > 50) {
      errors.push('First name must be less than 50 characters');
    }
    
    if (!data.phone || data.phone.trim() === '') {
      errors.push('Phone number is required');
    } else if (data.phone.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    } else if (!/^\d+$/.test(data.phone)) {
      errors.push('Phone number must contain only digits');
    } else if (data.phone.length > 15) {
      errors.push('Phone number must be less than 15 digits');
    }
    
    // Session validation
    if (data.session && !['morning', 'evening'].includes(data.session.toLowerCase())) {
      errors.push('Session must be either "morning" or "evening"');
    }
    
    // Gender validation
    if (data.gender && !['male', 'female', 'other'].includes(data.gender.toLowerCase())) {
      errors.push('Gender must be male, female, or other');
    }
    
    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Length validations
    if (data.last_name && data.last_name.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }
    
    if (data.nickname && data.nickname.length > 50) {
      errors.push('Nickname must be less than 50 characters');
    }
    
    if (data.address && data.address.length > 200) {
      errors.push('Address must be less than 200 characters');
    }
    
    if (data.working_status && data.working_status.length > 100) {
      errors.push('Working status must be less than 100 characters');
    }
    
    if (data.branch && data.branch.length > 100) {
      errors.push('Branch must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  cleanCSVData(data) {
    return {
      first_name: (data.first_name || data['First Name'] || data['first name'] || '').trim(),
      last_name: (data.last_name || data['Last Name'] || data['last name'] || '').trim(),
      phone: (data.phone || data.Phone || data.phone_number || '').trim().replace(/\D/g, ''),
      nickname: (data.nickname || data.Nickname || data.nick_name || '').trim(),
      referred_by: (data.referred_by || data['Referred By'] || data['referred by'] || '').trim(),
      address: (data.address || data.Address || '').trim(),
      working_status: (data.working_status || data['Working Status'] || data['working status'] || '').trim(),
      session: (data.session || data.Session || 'morning').trim().toLowerCase(),
      branch: (data.branch || data.Branch || '').trim(),
      gender: (data.gender || data.Gender || 'male').trim().toLowerCase(),
      email: (data.email || data.Email || '').trim().toLowerCase(),
    };
  }

  async processBatch(gym, batch, startingRow) {
    const batchResults = {
      successful: 0,
      failed: 0,
      errors: []
    };

    const promises = batch.map(async (memberData, index) => {
      const currentRow = startingRow + index;
      
      try {
        await this.createSingleMember(gym, memberData);
        batchResults.successful++;
      } catch (error) {
        batchResults.failed++;
        batchResults.errors.push({
          row: currentRow,
          member: `${memberData.first_name} ${memberData.last_name}`.trim(),
          phone: memberData.phone,
          error: error.message
        });
      }
    });

    await Promise.allSettled(promises);
    return batchResults;
  }

  async createSingleMember(gym, memberData) {
    // Check for duplicates
    const existing = await Member.findOne({
      gym: gym.id.toString(),
      $or: [
        { first_name: memberData.first_name, phone: memberData.phone },
        { phone: memberData.phone }
      ]
    });

    if (existing) {
      if (existing.first_name === memberData.first_name && existing.phone === memberData.phone) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with same name and phone already exists in this gym'
        );
      } else if (existing.phone === memberData.phone) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with the same phone number already exists in this gym'
        );
      }
    }

    // Create member
    const member = await Member.create({
      first_name: memberData.first_name,
      last_name: memberData.last_name || null,
      phone: memberData.phone,
      nickname: memberData.nickname || null,
      referred_by: memberData.referred_by || null,
      address: memberData.address,
      working_status: memberData.working_status,
      session: memberData.session,
      branch: memberData.branch,
      gender: memberData.gender,
      email: memberData.email,
      gym: gym._id,
    });

    return member;
  }


  // Optional: Bulk image upload method
//   async bulkImageUpload(gym, files) {
//     const results = {
//       total: files.length,
//       successful: 0,
//       failed: 0,
//       errors: []
//     };

//     for (const file of files) {
//       try {
//         // Extract member identifier from filename (e.g., "john_doe_1234567890.jpg")
//         const identifier = file.originalname.split('.')[0];
//         const member = await this.findMemberByIdentifier(gym, identifier);

//         if (member) {
//           await member.uploadProfilePic(file);
//           results.successful++;
//         } else {
//           results.failed++;
//           results.errors.push({
//             file: file.originalname,
//             error: 'Member not found'
//           });
//         }
//       } catch (error) {
//         results.failed++;
//         results.errors.push({
//           file: file.originalname,
//           error: error.message
//         });
//       }
//     }

//     return results;
//   }

//   async findMemberByIdentifier(gym, identifier) {
//     // Try to find by phone first (most reliable)
//     let member = await Member.findOne({
//       gym: gym._id,
//       phone: identifier
//     });

//     if (!member) {
//       // Try to find by name and phone combination (e.g., "john_doe_1234567890")
//       const parts = identifier.split('_');
//       if (parts.length >= 3) {
//         const phone = parts[parts.length - 1];
//         const firstName = parts[0];
//         const lastName = parts.slice(1, -1).join(' ');
        
//         member = await Member.findOne({
//           gym: gym._id,
//           first_name: firstName,
//           last_name: lastName,
//           phone: phone
//         });
//       }
//     }

//     return member;
//   }
}

export default new CSVMemberService();