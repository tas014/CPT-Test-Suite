import React, { useState } from 'react'
import logo from '../img/Logo.png'
import { Link, useParams } from 'react-router-dom';


const Header = () => {
    const path = window.location.pathname;
    return (
        <header>
            <div>
                <img className='logo' src={logo} alt='El logo de Edesur' />
            </div>
            <div>
                <nav>
                    <ul className='flexend'>
                        <li>
                            <Link className={(path === '/monofasico' || path === '/') ? 'nav-item nav-selected' : 'nav-item'} to={'/monofasico'}>Monofasico</Link>
                        </li>
                        <li>
                            <Link className={path === '/trifasico' ? 'nav-item nav-selected' : 'nav-item'} to={'/trifasico'}>Trifasico</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header