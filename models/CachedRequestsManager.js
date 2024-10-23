import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let CachesRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

global.RequestCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {

    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, CachesRequestsExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");
    }

    static add(url, content, ETag = "") {  if (!cachedRequestsCleanerStarted) {
        cachedRequestsCleanerStarted = true;
        CachedRequestsManager.startCachedRequestsCleaner();
    }
    if (url != "") {
        CachedRequestsManager.clear(url);
        RequestCaches.push({
            url,
            content,
            ETag,
            Expire_Time: utilities.nowInSeconds() + CachesRequestsExpirationTime
        });
        console.log(BgWhite + FgBlue, `[Data of ${url} repository has been cached]`);
    }}

    
    static find(url) { try {
        if (url != "") {
            for (let cache of RequestCaches) {
                if (cache.url == url) {
                    // renew cache
                    cache.Expire_Time = utilities.nowInSeconds() + CachesRequestsExpirationTime;
                    console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                    return cache;
                }
            }
        }
    } catch (error) {
        console.log(BgWhite + FgRed, "[repository cache error!]", error);
    }
    return null;}


    static clear(url) {if (url != "") {
        let indexToDelete = [];
        let index = 0;
        for (let cache of RequestCaches) {
            if (cache.url == url) indexToDelete.push(index);
            index++;
        }
        utilities.deleteByIndex(RequestCaches, indexToDelete);
    }}
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of RequestCaches ) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.ETag + ".json expired");
            }
        }
        RequestCaches  = RequestCaches .filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        const cachedData = CachedRequestsManager.find(HttpContext.req.url);
        //si trouver, envoyer avec true
        if (cachedData) {
            HttpContext.response.JSON(cachedData.content, cachedData.ETag, true); 
            return true
        }
        //sinon non
        else {
           
            return false
        }
    }

}
