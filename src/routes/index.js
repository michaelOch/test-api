import express from "express";
import config from "../config";
import middleware from "../middleware";
import initializeDb from "../config/db";
import user from "../controller/user";

const router = express();

initializeDb(db => {
    //internal middleware
    router.use(middleware({ config, db }));
    router.use('/user', user({ config, db }));
});

export default router;
