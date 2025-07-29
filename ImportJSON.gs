/**
 * ImportJSON - Optimized for Google Apps Script
 * ====================================================================
 * Derived from this project: https://github.com/bradjasper/ImportJSON
 * Streamlined version focusing only on ImportJSON() functionality
 * Optimized for Google Sheets custom functions
 * ====================================================================
 */

/**
 * Imports a JSON feed and returns the results for Google Spreadsheet.
 * The JSON feed is flattened to create a two-dimensional array with headers.
 * 
 * @param {string} url - URL to a public JSON feed
 * @param {string} query - Comma-separated list of paths to import (optional)
 * @param {string} parseOptions - Options: noTruncate,rawHeaders,noHeaders,debugLocation (optional)
 * @customfunction
 * @return {Array} Two-dimensional array with headers in first row
 */
function ImportJSON(url, query, parseOptions) {
  // Input validation
  if (!url || typeof url !== 'string') {
    throw new Error('ImportJSON: URL parameter is required and must be a string');
  }
  
  try {
    // Fetch JSON data with timeout
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    // Check response status
    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
    }
    
    const jsonData = JSON.parse(response.getContentText());
    return parseJSONObject_(jsonData, query, parseOptions);
    
  } catch (error) {
    // Return error in spreadsheet-friendly format
    return [['Error'], [error.message]];
  }
}

/**
 * Parses JSON object into spreadsheet-ready 2D array
 */
function parseJSONObject_(object, query, options) {
  const headers = new Map();
  const data = [];
  const opts = parseOptions_(options);
  const queryPaths = parseQuery_(query);
  
  // Parse JSON data recursively
  parseData_(headers, data, '', { rowIndex: 1 }, object, queryPaths, opts);
  
  // Convert headers map to array and insert as first row
  if (headers.size > 0) {
    data[0] = new Array(headers.size);
    for (const [path, index] of headers) {
      data[0][index] = path;
    }
  }
  
  // Apply transformations
  transformData_(data, opts);
  
  // Return data (with or without headers)
  return opts.noHeaders && data.length > 1 ? data.slice(1) : data;
}

/**
 * Recursively parses JSON data into flat structure
 */
function parseData_(headers, data, path, state, value, query, options) {
  let inserted = false;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    
    // Check if array contains objects
    const hasObjects = value.some(item => 
      item !== null && typeof item === 'object' && !Array.isArray(item)
    );
    
    if (hasObjects) {
      // Process each object in array
      for (let i = 0; i < value.length; i++) {
        if (parseData_(headers, data, path, state, value[i], query, options)) {
          inserted = true;
          if (data[state.rowIndex]) {
            state.rowIndex++;
          }
        }
      }
    } else {
      // Join scalar array values
      if (shouldInclude_(query, path)) {
        insertValue_(headers, data, path, state, value.join(', '));
        inserted = true;
      }
    }
  } else if (value !== null && typeof value === 'object') {
    // Process object properties
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const newPath = path ? `${path}/${key}` : `/${key}`;
        if (parseData_(headers, data, newPath, state, value[key], query, options)) {
          inserted = true;
        }
      }
    }
  } else if (shouldInclude_(query, path)) {
    // Insert scalar value
    insertValue_(headers, data, path, state, value);
    inserted = true;
  }
  
  return inserted;
}

/**
 * Inserts a value into the data structure
 */
function insertValue_(headers, data, path, state, value) {
  // Initialize row if needed
  if (!data[state.rowIndex]) {
    data[state.rowIndex] = [];
  }
  
  // Get or create column index
  if (!headers.has(path)) {
    headers.set(path, headers.size);
  }
  
  const columnIndex = headers.get(path);
  data[state.rowIndex][columnIndex] = value;
}

/**
 * Checks if path should be included based on query
 */
function shouldInclude_(query, path) {
  if (!query || query.length === 0) return true;
  return query.some(q => path.indexOf(q) === 0);
}

/**
 * Applies transformations to data
 */
function transformData_(data, options) {
  if (!data || data.length === 0) return;
  
  const numRows = data.length;
  const numCols = data[0] ? data[0].length : 0;
  
  for (let row = 0; row < numRows; row++) {
    if (!data[row]) continue;
    
    for (let col = 0; col < numCols; col++) {
      transformCell_(data, row, col, options);
    }
  }
}

/**
 * Transforms individual cell
 */
function transformCell_(data, row, col, options) {
  // Handle null/undefined values
  if (data[row][col] == null) {
    data[row][col] = '';
    return;
  }
  
  let value = data[row][col];
  
  // Header transformations (row 0)
  if (row === 0 && !options.rawHeaders) {
    // Remove common prefixes from headers
    if (col === 0 && data[row].length > 1) {
      removeCommonPrefixes_(data, row);
      value = data[row][col]; // Get updated value
    }
    
    // Convert to title case and clean up
    value = value.toString()
      .replace(/[\/\_]/g, ' ')
      .replace(/\w\S*/g, word => 
        word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
      );
  }
  
  // Truncate long values
  if (!options.noTruncate && value) {
    value = value.toString().substr(0, 256);
  }
  
  // Add debug info
  if (options.debugLocation) {
    value = `[${row},${col}]${value}`;
  }
  
  data[row][col] = value;
}

/**
 * Removes common prefixes from header row
 */
function removeCommonPrefixes_(data, row) {
  if (!data[row] || data[row].length < 2) return;
  
  let commonLength = data[row][0] ? data[row][0].length : 0;
  
  // Find common prefix length
  for (let i = 1; i < data[row].length && commonLength > 0; i++) {
    if (!data[row][i]) {
      commonLength = 0;
      break;
    }
    
    const str1 = data[row][i-1].toString();
    const str2 = data[row][i].toString();
    const maxLen = Math.min(commonLength, str1.length, str2.length);
    
    for (let j = 0; j < maxLen; j++) {
      if (str1.charAt(j) !== str2.charAt(j)) {
        commonLength = j;
        break;
      }
    }
  }
  
  // Remove common prefix
  if (commonLength > 0) {
    for (let i = 0; i < data[row].length; i++) {
      if (data[row][i]) {
        data[row][i] = data[row][i].toString().substring(commonLength);
      }
    }
  }
}

/**
 * Parses query parameter into array of paths
 */
function parseQuery_(query) {
  if (!query) return [];
  if (Array.isArray(query)) return query;
  
  return query.toString()
    .split(',')
    .map(path => path.trim())
    .filter(path => path.length > 0);
}

/**
 * Parses options parameter into object
 */
function parseOptions_(options) {
  const defaults = {
    noTruncate: false,
    rawHeaders: false,
    noHeaders: false,
    debugLocation: false
  };
  
  if (!options) return defaults;
  
  const optionList = options.toString()
    .toLowerCase()
    .split(',')
    .map(opt => opt.trim());
  
  return {
    noTruncate: optionList.includes('notruncate'),
    rawHeaders: optionList.includes('rawheaders'),
    noHeaders: optionList.includes('noheaders'),
    debugLocation: optionList.includes('debuglocation')
  };
}