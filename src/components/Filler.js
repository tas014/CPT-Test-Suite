import React from 'react'
import { CiCirclePlus } from "react-icons/ci";

const Filler = () => {
  return (
    <div>
        <div>
            <CiCirclePlus color='#799FE8' size={70} className='circleIcon'/>
            <p>Arrastre los archivos o haga clic en esta sección para seleccionarlos.</p>
        </div>
    </div>
  )
}

export default Filler