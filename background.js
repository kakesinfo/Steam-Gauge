const CACHE_DURATION_MS = 12 * 60 * 60 * 1000;

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

	if (cacheData && (Date.now() - cacheData.timestamp < CACHE_DURATION_MS))
		return cacheData.data;

	const [hltbResult, igResult, steamResult] = await Promise.allSettled([
		fetchHLTB(appId),
		fetchInstantGamingData(appId, gameName, editionId),
		fetchSteamPriceHistory(appId)
	]);

	const combinedData = {
		hltb: hltbResult.status === 'fulfilled' ? hltbResult.value : null,
		ig: igResult.status === 'fulfilled' ? igResult.value : null,
		steam: steamResult.status === 'fulfilled' ? steamResult.value : null
	};

	await chrome.storage.local.set({
		[cacheKey]: { data: combinedData, timestamp: Date.now() }
	});

	return combinedData;
}

async function fetchHLTB(appId) {
	const url = `https://hltbapi1.azurewebsites.net/steam/${appId}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`HLTB API error: ${response.status}`);
	
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

	if (!response.ok) throw new Error(`Instant Gaming error: ${response.status}`);
	
	try {
		const data = await response.json();
		if (data && data.success && data.url) {
			const priceNumber = parseFloat(String(data.price).replace(',', '.'));
			if (priceNumber > 0) return data; 
		}
	} catch (e) {
		console.warn("Invalid Instant Gaming API");
	}
	return null;
}

async function fetchSteamPriceHistory(appId) {
		const cachedApiKey = await chrome.storage.local.get(['itadApiKey']);
		const apiKey = cachedApiKey.itadApiKey;

		console.log(`Fetching Steam price history for AppID: ${appId}`);
		
		if (!apiKey) {
				console.error("L'utilisateur n'a pas configuré sa clé API.");
				return null;
		}

		try {
				const lookupRes = await fetch(`https://api.isthereanydeal.com/games/lookup/v1?type=app&key=${apiKey}&appid=${appId}`);
				
				if (!lookupRes.ok)
					throw new Error(`Erreur Lookup HTTP: ${lookupRes.status}`);
				
				const lookupData = await lookupRes.json();
				if (!lookupData || !lookupData.game || !lookupData.game.id) {
						console.warn(`Jeu Steam (AppID: ${appId}) introuvable sur IsThereAnyDeal.`);
						return null;
				}
			
				const gameId = lookupData.game.id; 
				const payload = [gameId]; 
			
				const lowestRes = await fetch(`https://api.isthereanydeal.com/games/storelow/v2?key=${apiKey}&country=FR&shops=61`, {
						method: 'POST',
						headers: {
								'Content-Type': 'application/json'
						},
						body: JSON.stringify(payload)
				});

				if (!lowestRes.ok) throw new Error(`Erreur Storelow HTTP: ${lowestRes.status}`);

				const lowestData = await lowestRes.json();
				if (!lowestData || lowestData.length !== 1 || !lowestData[0] || !lowestData[0].lows || lowestData[0].lows.length === 0)
					throw new Error("Données de prix invalides reçues de l'API IsThereAnyDeal.");
				
				console.log("Données de prix brutes :", lowestData);
				
				return lowestData[0].lows[0];

		} catch (error) {
				console.error("Erreur lors de la récupération du prix :", error);
				return null;
		}
}