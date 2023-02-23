import { mockData } from './mock-data';
import axios from 'axios';
import NProgress from 'nprogress';

export const getAccessToken = async () => {
    const accessToken = localStorage.getItem('access_token');
    const tokenCheck = accessToken && (await checkToken(accessToken));
    
        if(!accessToken || tokenCheck.error) {
            await localStorage.removeItem("access_token");
            const searchParams = new URLSearchParams(window.location.search);
            const code = await searchParams.get("code");
            if (!code) {
                const results = await axios.get(
                    "https://qbbomao7r4.execute-api.us-east-1.amazonaws.com/dev/api/get-auth-url"
                )
                    .catch(function (error) {
                        if (error.response) {
                            console.log(error.response.data);
                            console.log(error.response.status);
                            console.log(error.response.headers);
                        } else if (error.request) {
                            console.log(error.request);
                        } else {
                            console.log('Error', error.message);
                        }
                        console.log(error.config);
                    });
                const { authUrl } = results.data;
                return (window.location.href = authUrl);
            }
            return code && getToken(code);
        }
        return accessToken;
}

export const checkToken = async (accessToken) => {
    const result = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    )
        .then((res) => res.json())
        .catch((error) => error.json());

    return result;
};

export const getEvents = async () => {
    NProgress.start();

    if (window.location.href.startsWith('http://localhost')) {
        NProgress.done();
        return mockData;
    }

    const token = await getAccessToken();

    if (token) {
        removeQuery();
        const url = `https://qbbomao7r4.execute-api.us-east-1.amazonaws.com/dev/api/get-events/${token}`;
        const result = await axios.get(url)
            // .then(data => {
            //     console.log(data.access_token);
            //     return data;
            // })
            // .catch(function (error) {
            //     if (error.response) {
            //         console.log(error.response.data);
            //         console.log(error.response.status);
            //         console.log(error.response.headers);
            //     } else if (error.request) {
            //         console.log(error.request);
            //     } else {
            //         console.log('Error', error.message);
            //     }
            //     console.log(error.config);
            // });
            console.log('result', result);

        if (result.data) {
            var locations = extractLocations(result.data.events);
            localStorage.setItem("lastEvents", JSON.stringify(result.data));
            localStorage.setItem("locations", JSON.stringify(locations));
        }
        NProgress.done();
        return result.data.events;
    }
  };

export const extractLocations = (events) => {
    var extractLocations = events.map((event) => event.location);
    var locations = [...new Set(extractLocations)];
    return locations;
};

const removeQuery = () => {
    if (window.history.pushState && window.location.pathname) {
        var newurl =
            window.location.protocol + 
            "//" +
            window.location.host +
            window.location.pathname;
        window.history.pushState("", "", newurl);
    } else {
        newurl = window.location.protocol + "//" + window.location.host;
        window.history.pushState("", "", newurl);
    }
};

const getToken = async (code) => {
    try {
        const encodeCode = encodeURIComponent(code);
        const { access_token } = await fetch(
            `https://qbbomao7r4.execute-api.us-east-1.amazonaws.com/dev/api/token/${encodeCode}`
        )
            .then((res) => {
                return res.json();
            })
            .then(data => {
                console.log("access_token", data.access_token);
                return data;
            })
            .catch((error) => error);

        access_token && localStorage.setItem("access_token", access_token);
        
        return access_token; 
    } catch (error) {
        console.error(error);
    }
};

