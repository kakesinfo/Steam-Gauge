// On met le cache sur 24 heures (en millisecondes) pour les durées de jeu
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchHLTB") {
    getHLTBWithCache(request.appId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; 
  }
});

async function getHLTBWithCache(appId) {
  const cacheKey = `hltb_${appId}`;
  
  const cached = await chrome.storage.local.get(cacheKey);
  const cacheData = cached[cacheKey];

  // Si le cache est valide, on l'utilise
  if (cacheData && (Date.now() - cacheData.timestamp < CACHE_DURATION_MS)) {
    return cacheData.data;
  }

  // Appel direct à l'API azure avec l'appId
  const url = `https://hltbapi1.azurewebsites.net/steam/${appId}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur API HLTB: ${response.status}`);
  
  try {
    const data = await response.json();
    
    // Sauvegarde dans le cache
    await chrome.storage.local.set({
      [cacheKey]: { data: data, timestamp: Date.now() }
    });

    return data;
  } catch (e) {
    console.warn("L'API n'a pas renvoyé de JSON valide.");
    return null;
  }
}