import { Time } from "./Time";

export interface Section {
  name: string; // CPSC 221 911
  subject: string; // CPSC 
  course: string; // 221
  section: string; // 911
  status: string; 
  activity: string;
  term: string;
  schedule: Array<Time>
  interval: string;
  comments: string;
  link: string;
  endpoint: string;
  lastUpdated?: string;
}