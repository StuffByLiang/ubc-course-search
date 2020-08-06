export interface Course {
  name: string;
  subject: string;
  course: string;
  title: string;
  description: string;
  credits: number;
  comments: Array<string>;
  endpoint: string;
  link: string;
  lastUpdated?: Date;
}