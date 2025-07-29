/**
 * FormatTypes - Optimized for Google Apps Script
 * ====================================================================
 * Efficiently formats types using cached lookup table from spreadsheet
 * ====================================================================
 */

/**
 * Formats comma-separated types using lookup table from 'type_lookup' sheet
 * @param {string} types - Comma-separated list of types to format
 * @customfunction
 * @return {string} Formatted types joined by comma and space
 */
function FormatTypes(types) {
  // Early return for empty/null input
  if (!types || types.toString().trim() === '') return '';
  
  const lookupMap = getTypeLookupMap_();
  
  // Process types in single chain with early filtering
  const formatted = types
    .toString()
    .split(',')
    .reduce((acc, type) => {
      const trimmed = type.trim();
      if (trimmed && lookupMap.has(trimmed)) {
        acc.push(lookupMap.get(trimmed));
      }
      return acc;
    }, []);
  
  return formatted.join(', ');
}

/**
 * Gets cached type lookup map with optimized caching strategy
 * @private
 */
function getTypeLookupMap_() {
  const CACHE_KEY = 'typeLookup';
  const CACHE_VERSION_KEY = 'typeLookupVersion';
  const CACHE_DURATION = 3600000; // 1 hour in milliseconds
  
  try {
    const cache = PropertiesService.getScriptProperties();
    const properties = cache.getProperties();
    
    // Check if cache is valid
    if (isCacheValid_(properties)) {
      return new Map(JSON.parse(properties[CACHE_KEY]));
    }
    
    // Rebuild cache
    const lookupMap = buildLookupMap_();
    
    // Store with timestamp
    const cacheData = {
      [CACHE_KEY]: JSON.stringify([...lookupMap]),
      [CACHE_VERSION_KEY]: Date.now().toString()
    };
    
    cache.setProperties(cacheData);
    return lookupMap;
    
  } catch (error) {
    console.error('Cache error, rebuilding:', error);
    return buildLookupMap_();
  }
}

/**
 * Checks if cached data is still valid
 * @private
 */
function isCacheValid_(properties) {
  if (!properties.typeLookup || !properties.typeLookupVersion) {
    return false;
  }
  
  const cacheTime = parseInt(properties.typeLookupVersion);
  const now = Date.now();
  const CACHE_DURATION = 3600000; // 1 hour
  
  return (now - cacheTime) < CACHE_DURATION;
}

/**
 * Builds lookup map from spreadsheet data
 * @private
 */
function buildLookupMap_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('type_lookup');
    
    if (!sheet) {
      throw new Error("Sheet 'type_lookup' not found");
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 1) {
      return new Map();
    }
    
    // Get data in single call
    const data = sheet.getRange(1, 1, lastRow, 2).getValues();
    
    // Build Map directly (faster than Object for lookups)
    const lookupMap = new Map();
    
    for (let i = 0; i < data.length; i++) {
      const [key, value] = data[i];
      // Only add non-empty keys and values
      if (key && value) {
        lookupMap.set(key.toString().trim(), value.toString());
      }
    }
    
    return lookupMap;
    
  } catch (error) {
    console.error('Error building lookup map:', error);
    return new Map();
  }
}

/**
 * Utility function to manually refresh the cache
 * Call this when type_lookup sheet is updated
 */
function refreshTypeLookupCache() {
  try {
    PropertiesService.getScriptProperties().deleteProperty('typeLookup');
    PropertiesService.getScriptProperties().deleteProperty('typeLookupVersion');
    
    // Rebuild cache
    getTypeLookupMap_();
    
    return 'Cache refreshed successfully';
  } catch (error) {
    return `Error refreshing cache: ${error.message}`;
  }
}

/**
 * Debug function to check cache status
 */
function getTypeLookupCacheInfo() {
  const cache = PropertiesService.getScriptProperties();
  const properties = cache.getProperties();
  
  if (!properties.typeLookupVersion) {
    return 'No cache found';
  }
  
  const cacheTime = new Date(parseInt(properties.typeLookupVersion));
  const mapSize = properties.typeLookup ? 
    JSON.parse(properties.typeLookup).length : 0;
  
  return {
    cacheTime: cacheTime.toLocaleString(),
    mapSize: mapSize,
    isValid: isCacheValid_(properties)
  };
}