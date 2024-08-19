import React, { useState } from 'react'
import logo from '../img/Logo.png'


const Header = () => {
    const [selected, setSelected] = useState(1);
    return (
        <header>
            <div>
                <img className='logo' src={logo} alt='El logo de Edesur'/>
            </div>
            <div>
                <nav>
                    <a href='' onClick={()=>{setSelected(1)}} className={selected === 1 ? 'nav-item nav-selected' : 'nav-item'} target='_blank'>Nivel de Tensión Monofásico</a>
                    {/*<a href='https://www.youtube.com/watch?v=dQw4w9WgXcQ' onClick={()=>{setSelected(2)}} className={selected === 2 ? 'nav-item nav-selected' : 'nav-item'} target='_blank'>Modulo 2</a>
                    <a href='https://www.youtube.com/watch?v=dQw4w9WgXcQ' onClick={()=>{setSelected(3)}} className={selected === 3 ? 'nav-item nav-selected' : 'nav-item'} target='_blank'>Modulo 3</a>*/}
                </nav>
            </div>
        </header>
    )
}

export default Header