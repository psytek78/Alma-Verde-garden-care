import { z } from 'zod';
import { database, readInspections, type GardenTask } from '@/lib/inspection-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const schema=z.object({id:z.string().min(1).max(100),assignee:z.string().max(500),resolved:z.boolean(),version:z.string().min(1).max(128)}).strict();
export async function GET(){try{return Response.json({rows:await readInspections()},{headers});}catch{return Response.json({error:'Unable to load saved garden care tasks. Please try again.'},{status:503,headers});}}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request'},{status:403,headers});
 try{
  const update=schema.parse(await req.json());const db=database();
  const [existing]=await db.sql<GardenTask>`SELECT * FROM inspections WHERE id = ${update.id}`;
  if(!existing)return Response.json({error:'Adding tasks is not permitted.'},{status:403,headers});
  if(String(existing.version)!==update.version)return Response.json({error:'This task changed. Close and reopen it before saving.'},{status:409,headers});
  if(existing.resolved&&!update.resolved)return Response.json({error:'Completed tasks cannot be reopened.'},{status:403,headers});
  const completedDate=update.resolved?(existing.resolved?(existing.completed_date??null):new Date().toLocaleDateString('en-CA',{timeZone:'Atlantic/Canary'})):null;
  const version=crypto.randomUUID();
  const out=await db.sql<GardenTask>`UPDATE inspections SET assignee=${update.assignee}, resolved=${update.resolved}, completed_date=${completedDate}, version=${version} WHERE id=${update.id} AND version=${update.version} RETURNING *`;
  if(!out.length)return Response.json({error:'This task changed. Close and reopen it before saving.'},{status:409,headers});
  return Response.json({row:{...existing,assignee:update.assignee,resolved:update.resolved,completed_date:completedDate,version}},{headers});
 }catch(e){return Response.json({error:e instanceof z.ZodError?'Only the assignee and resolution status can be changed.':'Unable to confirm the save. Reload before trying again.'},{status:e instanceof z.ZodError?400:503,headers});}
}
