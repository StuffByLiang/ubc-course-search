import {Course} from "./Course";
import { Time } from "./Time";

export interface SectionInfo {
    status: string,
    activity : string,
    name: string,
    subject: string,
    course: string,
    section: string,
    textbooks: Array<string>;
    pre_reqs?: Array<Array<Course>>;
    prof: string; 
    term: string;
    year: string;
    schedule: Array<Time>;
    total_seats_remaining: number;
    currently_registered: number;
    general_seats_remaining: number;
    restricted_seats_remaining: number;
    seats_reserved_for: Array<string>;
    credits: string;
    course_avg?: number; 
    prof_rating?: number;
    link: string;
    lastUpdated?: string;
}