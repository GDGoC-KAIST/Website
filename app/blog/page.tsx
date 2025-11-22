import BlogPostSection2 from '../component/BlogPostSection2'
import PostsPage from '../component/PostsPage';
import { FaLaptopCode, FaCloud, FaDatabase } from "react-icons/fa"

const myPosts = [
  {
    id: "post-1",
    title: "Exploring the World of SvelteKit",
    summary: "A beginner's guide to building web apps with Svelte and SvelteKit.",
    author: { name: "Jane Doe" },
    published: "18 May 2024",
    url: "/blog/sveltekit",
    image: "/images/svelte.jpg",
    tag: "Svelte",
  },
  {
    id: "post-2",
    title: "Styling with CSS-in-JS",
    summary: "An in-depth look at different CSS-in-JS libraries and best practices.",
    author: { name: "John Smith" },
    published: "22 Jun 2024",
    url: "/blog/css-in-js",
    image: "/images/css-in-js.jpg",
    tag: "CSS",
  },
  
  {
    id: "post-2",
    title: "Styling with CSS-in-JS",
    summary: "An in-depth look at different CSS-in-JS libraries and best practices.",
    author: { name: "John Smith" },
    published: "22 Jun 2024",
    url: "/blog/css-in-js",
    image: "/images/css-in-js.jpg",
    tag: "CSS1",
  },
  {
    id: "post-2",
    title: "Styling with CSS-in-JS",
    summary: "An in-depth look at different CSS-in-JS libraries and best practices.",
    author: { name: "John Smith" },
    published: "22 Jun 2024",
    url: "/blog/css-in-js",
    image: "/images/css-in-js.jpg",
    tag: "CSS2",
  },
];


export default function Home() {

  return (
    /*
    <div>
      
      <BlogPostSection2
        heading={{
          text: "Developer Insights",
          headingClassName: "text-red-500"
        }}
        description={{ text: "Stay ahead with expert articles on modern web development." }}
        buttonText="View all articles"
        buttonUrl="/articles"
        
        badge={{
          mainText: "New",
          secondText: "Latest Releases",
          className: "bg-green-500/10",
          isVisible: true
        }}

        posts={myPosts}
      />
    </div>*/
    <div className='mt-32'>
      <PostsPage
        mainHeading={{ text: "Our Latest Articles & Guides", className: "text-black-700 md:text-5xl" }}
        subHeading={{ text: "Stay informed with insights from our experts.", className: "text-lg italic" }}
        techIcons={[
          { icon: <FaLaptopCode size={28} />, name: "Development" },
          { icon: <FaCloud size={28} />, name: "Cloud Computing" },
          { icon: <FaDatabase size={28} />, name: "Data Science" },
        ]}
        primaryButton={{
          text: "Discover All Publications",
          className: "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white",
          isVisible: true,
          // onClickButton: () => alert("Navigating to all posts!"), // Add actual navigation logic here
        }}
        secondaryButton={{
          text: "Join Our Newsletter",
          className: "border-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50",
          // onClickButton: () => console.log("Newsletter signup initiated."), // Add actual logic here
        }}
      />
    </div>

  )
}