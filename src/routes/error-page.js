import React from 'react'
import { useRouteError } from 'react-router-dom'

const ErrorPage = () => {
    const error = useRouteError()
    return (
        <section className='route-error flex centerX centerY'>
            <div className='flexV centerX centerY'>
                <h1>Esta sección no existe...</h1>
                <h3>Error: {error.statusText || error.message}</h3>
                <p>Me temo que nos encontramos en el incómodo momento en el que me toca informarte que el URL al que intentaste acceder no existe. Checkea que el URL sea correcto, y en caso de que este mensaje siga apareciendo sin importar el URL por favor informar al desarrollador del sitio: <a href='francopiccobusiness@gmail.com'>francopiccobusiness@gmail.com</a></p>
            </div>
        </section>
    )
}

export default ErrorPage