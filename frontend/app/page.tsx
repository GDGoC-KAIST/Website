
import FeatureSection7 from "./component/FeatureSection7"

const customAccordionItems = [
  {
    id: "about",
    title: { text: "About" },
    content: { text: "Our multi-layered security protocols protect your data from every angle, ensuring peace of mind." },
  },
  {
    id: "blog",
    title: { text: "Blog" },
    content: { text: "We provide round-the-clock support to assist you with any inquiries or issues you may have." },
  },
  {
    id: "members",
    title: { text: "Members" },
    content: { text: "We provide round-the-clock support to assist you with any inquiries or issues you may have." },
  },
  {
    id: "contact",
    title: { text: "Contact" },
    content: { text: "We provide round-the-clock support to assist you with any inquiries or issues you may have." },
  },
];

const customImages: ImageItem[] = [
  {
    id: "mobile-banking",
    src: "./GDG-Sticker-Slider.gif",
    alt: "Mobile Banking App",
  },
  {
    id: "business-meeting",
    src: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=1032",
    alt: "Business Meeting",
  },
  {
    id: "professional",
    src: "./GDG-Sticker-Brackets.gif",
    alt: "Banking Professional",
    imageFitOptions: "object-contain",
  },
];

export default function Home() {

  return (
    <div>
      <div className='flex justify-center items-center h-screen'>
        <img className='max-w-full h-auto' src = "/gdgoc_icon.png"/>
        
      </div>

      <FeatureSection7
        mainHeading={{text: "GDG on Campus KAIST"}}
        subHeading={{text: "We are Google Developer Group on Campus KAIST"}}
        accordionItems={customAccordionItems}
        images={customImages}
      />

    </div>
  )
}
