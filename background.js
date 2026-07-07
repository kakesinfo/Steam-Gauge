const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure de cache pour garder les prix frais

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    getCombinedData(request.appId, request.gameName, request.editionId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; 
  }
});

async function getCombinedData(appId, gameName, editionId) {
  const cacheKey = `stats_${appId}`;
  
  const cached = await chrome.storage.local.get(cacheKey);
  const cacheData = cached[cacheKey];

  if (cacheData && (Date.now() - cacheData.timestamp < CACHE_DURATION_MS)) {
    return cacheData.data;
  }

  const [hltbResult, igResult] = await Promise.allSettled([
    fetchHLTB(appId),
    fetchInstantGamingData(appId, gameName, editionId)
  ]);

  const combinedData = {
    hltb: hltbResult.status === 'fulfilled' ? hltbResult.value : null,
    ig: igResult.status === 'fulfilled' ? igResult.value : null
  };

  await chrome.storage.local.set({
    [cacheKey]: { data: combinedData, timestamp: Date.now() }
  });

  return combinedData;
}

async function fetchHLTB(appId) {
  const url = `https://hltbapi1.azurewebsites.net/steam/${appId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur API HLTB: ${response.status}`);
  
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

async function fetchInstantGamingData(appId, gameName, editionId) {
  const params = new URLSearchParams({
    process: 'find_game',
    steamappid: appId,
    name: gameName || '',
    region: '',
    platform: 'pc',
    type: 'steam',
    find_steam_appid: 'undefined', 
    find_by_name: 'undefined',     
    isolang: 'fr', 
    medium: 'chrome',
    campaign: 'https://store.steampowered.com',
    editionId: editionId || ''     
  });

  const url = `https://www.instant-gaming.com/ext_api/?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { 'Accept': '*/*' }
  });

  if (!response.ok) throw new Error(`Erreur IG: ${response.status}`);
  
  try {
    const data = await response.json();
    if (data && data.success && data.url) {
      const priceNumber = parseFloat(String(data.price).replace(',', '.'));
      if (priceNumber > 0) return data; 
    }
  } catch (e) {
    console.warn("API Instant Gaming invalide.");
  }
  return null;
}