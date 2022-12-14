"use strict";
//voidSetup
import _ from "lodash";
import colors from "colors";
import express from "express";
import XMLSpecialChars from "xml-escape";
import fetch from "request";
import cors from "cors";
import {config} from "dotenv";
config();
import * as path from "path";

const hostName = "127.0.0.1";
const port = (process.env.PORT || 8080) as number;
const siteURL = `http://${hostName}:${port}`;
const server = express();

function declareXML(version: string = "1.0",encoding: BufferEncoding = "utf-8"){
    return `<?xml version="${version}" encoding="${encoding}"?>`;
}

function fetchNews(url: string,options?: fetch.CoreOptions): Promise<{
    status: string,
    totalResults: number,
    articles: {
        title: string,
        description: string,
        url: string,
        urlToImage: string
    }[]
}>{
    return new Promise((resolve,reject)=>{
        fetch(url,options,(error,response)=>{
            if(error){
                return reject(error);
            }
            resolve(JSON.parse(response.body));
        });
    });
}
//EJS
server.set("view engine","ejs");
server.set("views",path.join(process.cwd(),"views"));
//rotes
server.use(cors());

server.get("/",async(request,response,next)=>{
    try{
        const country = _.isString(request.query.country)? request.query.country: "tr";
        const data = await fetchNews(`https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${process.env.API_KEY}`,{
            method: "GET",
            headers: {
                "User-Agent": request.header("User-Agent")
            }
        });
        response.charset="utf-8";
        response.header("Cache-Control","no-cache, no-store, must-revalidate")
        .header("Expires",new Date(0).toUTCString())
        .header("Pragma","no-cache");
        if(data.status === "ok"){
            response.status(200).contentType("application/xml").render("index",{
                $: declareXML("1.0",response.charset as BufferEncoding),
                country,
                articles: data.articles.map((element)=>{
                    for(const key in element){
                        element[key] = XMLSpecialChars(String(element[key]));
                    }
                    return element;
                })
            });
        }else{
            response.sendStatus(400);
        }
    }catch(error){
        next(error);
    }
});

server.get("/favicon.ico",(request,response)=>{
    response.charset = "utf-8";
    response.status(200).sendFile(path.join(process.cwd(),"favicon.png"));
});

server.listen(port,hostName,()=>{
    console.log(colors.magenta("RSS running."));
    console.log(`URL: ${siteURL}`);
});