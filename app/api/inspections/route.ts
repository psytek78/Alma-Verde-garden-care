import { z } from 'zod';
import { database, readInspections, type GardenTask } from '@/lib/inspection-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const updateSchema=z.object({id:z.string().min(1).max(100),assignee:z.string().max(500),resolved:z.boolean(),version:z.string().min(1).max(128)}).strict();
const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const date=new Date(`${value}T12:00:00Z`);return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;});
const createSchema=z.object({date:isoDate,issue:z.string().trim().min(1).max(2000),cause:z.string().max(4000).default(''),solution:z.string().max(4000).default(''),assignee:z.string().max(500).default(''),resolved:z.boolean().default(false),notes:z.string().max(8000).default(''),photo:z.string().max(2000).default('').refine(value=>value===''||value.startsWith('https://'))}).strict();
export async function GET(){try{return Response.json({rows:await readInspections()},{headers});}catch{return Response.json({error:'Unable to load saved garden care tasks. Please try again.'},{status:503,headers});}}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request'},{status:403,headers});
 try{
  const body=await req.json() as Record<string,unknown>;const db=database();
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.id==='string'){
   const update=updateSchema.parse(body);
   const [existing]=await db.sql<GardenTask>`SELECT * FROM inspections WHERE id = ${update.id}`;
   if(!existing)return Response.json({error:'Task not found.'},{status:404,headers});
   if(String(existing.version)!==update.version)return Response.json({error:'This task changed. Close and reopen it before saving.'},{status:409,headers});
   if(existing.resolved&&!update.resolved)return Response.json({error:'Completed tasks cannot be reopened.'},{status:403,headers});
   const completedDate=update.resolved?(existing.resolved?(existing.completed_date??null):new Date().toLocaleDateString('en-CA',{timeZone:'Atlantic/Canary'})):null;
   const version=crypto.randomUUID();
   const out=await db.sql<GardenTask>`UPDATE inspections SET assignee=${update.assignee}, resolved=${update.resolved}, completed_date=${completedDate}, version=${version} WHERE id=${update.id} AND version=${update.version} RETURNING *`;
   if(!out.length)return Response.json({error:'This task changed. Close and reopen it before saving.'},{status:409,headers});
   return Response.json({row:{...existing,assignee:update.assignee,resolved:update.resolved,completed_date:completedDate,version}},{headers});
  }
  const created=createSchema.parse(body);
  const id=crypto.randomUUID();
  const version=crypto.randomUUID();
  const completedDate=created.resolved?new Date().toLocaleDateString('en-CA',{timeZone:'Atlantic/Canary'}):null;
  const out=await db.sql<GardenTask>`INSERT INTO inspections (id,date,issue,cause,solution,assignee,resolved,notes,photo,completed_date,version) VALUES (${id},${created.date},${created.issue},${created.cause},${created.solution},${created.assignee},${created.resolved},${created.notes},${created.photo},${completedDate},${version}) RETURNING *`;
  return Response.json({row:out[0]},{status:201,headers});
 }catch(e){return Response.json({error:e instanceof z.ZodError?'Check the task fields and try again.':'Unable to confirm the save. Reload before trying again.'},{status:e instanceof z.ZodError?400:503,headers});}
}
