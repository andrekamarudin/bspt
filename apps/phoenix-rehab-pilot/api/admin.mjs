import {json} from './_proxy.mjs';
export default async function handler(req,res){const result=await json(req,res,'admin');if(result)res.status(200).json(result)}
