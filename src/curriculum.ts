import { Topic } from './types';

export const CURRICULUM: Topic[] = [
  {
    id: 'intro-to-html',
    title: 'Introduction to HTML',
    description: 'Learn the basics of HyperText Markup Language.',
    content: 'HTML is the standard markup language for documents designed to be displayed in a web browser. It consists of a series of elements that tell the browser how to display content. Key concepts include tags like <h1>, <p>, <a>, and <img>.',
    difficulty: 'Beginner',
    order: 1
  },
  {
    id: 'css-basics',
    title: 'CSS Fundamentals',
    description: 'Style your web pages with Cascading Style Sheets.',
    content: 'CSS is used to style and layout web pages — for example, to alter the font, color, size, and spacing of your content, split it into multiple columns, or add animations and other decorative features. Selectors, properties, and values are the core building blocks.',
    difficulty: 'Beginner',
    order: 2
  },
  {
    id: 'javascript-intro',
    title: 'JavaScript for Beginners',
    description: 'Add interactivity to your websites.',
    content: 'JavaScript is a programming language that allows you to implement complex features on web pages. It is the third layer of the layer cake of standard web technologies, two of which (HTML and CSS) we have already covered. Variables, functions, and events are essential topics.',
    difficulty: 'Beginner',
    order: 3
  },
  {
    id: 'react-basics',
    title: 'Introduction to React',
    description: 'Build modern user interfaces with React.',
    content: 'React is a JavaScript library for building user interfaces. It is maintained by Meta and a community of individual developers and companies. React can be used as a base in the development of single-page or mobile applications. Components, props, and state are key concepts.',
    difficulty: 'Intermediate',
    order: 4
  }
];
