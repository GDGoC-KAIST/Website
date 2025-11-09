import {NavBar2} from "./component/nav-bar"

export default function Home() {

  return (
    <div>
      <NavBar2 
        authLinks={{ visible:false }}
        domain={{
          name: 'GDGoC',
          logo: (
            <div className = "flex size-8 bg-primary justify-center items-center">
              <img src="/gdgoc_icon.png" alt="gdgoc_icon"></img>
            </div>
          ),
        }}  
      />
    </div>
  )
}
