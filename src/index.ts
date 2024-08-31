import API from "./model/API";
import { apiConfig } from "./config/app.config";

const api = new API(apiConfig);

//Run API server
api.listen();
