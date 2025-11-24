import ContentCards from "../component/content-cards";
import { MdTravelExplore } from "react-icons/md";

const cards = [
  {
    id: "1",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "2",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
  {
    id: "3",
    icon: <MdTravelExplore/>,
    title: "Trip to Italy",
    content: "Visited Rome and Venice. Amazing architecture!",
    tags: ["Travel", "Europe"],
  },
];

export default function Home() {

  return (
    <div className='mt-32'>
      <ContentCards
        cards={cards}
        gridLayout={true}
      
      />
    </div>
  )
}