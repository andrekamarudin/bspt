import {json} from './_proxy.mjs';
export default async function handler(req,res){const result=await json(req,res,'auth');if(result)res.status(200).json(result)}
