import PostsPage from "../component/PostsPage";
import {FaLaptopCode, FaCloud, FaDatabase} from "react-icons/fa";

export default function Home() {
  return (
    <div className="mt-32">
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
  );
}
