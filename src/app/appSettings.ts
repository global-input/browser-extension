interface AppSettings{
    url?:string;
    apikey?:string;    
}
const VAR_NAMES={
        URL:"iterative.globaliputapp.url",
        APIKEY:"iterative.globaliputapp.apikey"
}
export const getGlobalInputSettings=()=>{
    let url=localStorage.getItem(VAR_NAMES.URL);
    let apikey=localStorage.getItem(VAR_NAMES.APIKEY);
    if(!url){
        url="https://globalinput.co.uk";
    }
    if(!apikey){
        apikey="k7jc3QcMPKEXGW5UC";
    }
    return {
        url,
        apikey
    }
  };

export const saveSettings=(settings:AppSettings)=>{    
    const original=getGlobalInputSettings();
    if(settings.url && settings.url.trim() !== original.url){
        localStorage.setItem(VAR_NAMES.URL,settings.url.trim());
    }
    if(settings.apikey && settings.apikey.trim() !== original.apikey){
        localStorage.setItem(VAR_NAMES.APIKEY,settings.apikey.trim());
    }
}