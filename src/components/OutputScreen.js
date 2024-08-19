import React from 'react'
import { VscLoading } from "react-icons/vsc";

const OutputScreen = ({handleDownload, hideComponent, warnings = [], penalty, fail = false, ready}) => {

    const successColor = warnings.length > 0 ? 'has-warning' : 'success';
    const outputTitle = warnings.length > 0 ? 'Archivos procesados pero...' : '¡Archivos procesados con éxito!';
    

  return (
    <div className='output-container' onClick={hideComponent}>
        <div>
            {!fail && 
            <div onClick={e => e.stopPropagation()}>
                <h3 className={ready ? successColor : 'title-loading'}>{ready ? outputTitle : 'Calculando...'}</h3>
                {warnings.length > 0 && 
                <ul>
                    {warnings.map((warning, ind) => <li key={ind}>{warning}</li>)}
                </ul>
                }
                <div className='debt-container'>
                    <label>Penalización resultante:</label>
                    <strong>{penalty}</strong>
                </div>
                <div className='success-button-container'>
                    <p>Descarga los resultados haciendo click en este botón</p>
                    <button className='download-button' disabled={!ready} onClick={handleDownload}>
                        {ready ? 'Descargar' : <VscLoading size={25} className='loadingIcon' />}
                    </button>
                </div>
            </div>}
            {fail && 
            <div className='fail' onClick={e => e.stopPropagation()}>
                <h3>Hubo un error: {fail}</h3>
                <p>Haz click fuera de la notificacion para esconder este mensaje...</p>
            </div>
            }
        </div>
    </div>
  )
}

// CUADERNO PALABRA CLAVE

export default OutputScreen