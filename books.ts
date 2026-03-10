export type Category = 'Barchasi' | 'Rus adabiyoti' | 'Chet el adabiyoti' | 'O\'Reilly';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: Category;
  coverImage: string;
  contentUrl: string;
  pages?: number;
  rating?: number;
  year?: number;
}
