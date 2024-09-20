import React from 'react'
import { VscLoading } from "react-icons/vsc";
import Modal from './Modal';
import Button from './Button';

const OutputScreen = ({ handleDownload, hideComponent, warnings = [], penalty, fail = false, ready }) => {

    const successColor = warnings.length > 0 ? 'has-warning' : 'success';
    const outputTitle = warnings.length > 0 ? 'Archivos procesados pero...' : '¡Archivos procesados con éxito!';


    return (
        <Modal hideComponent={hideComponent}>
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
                            <Button click={handleDownload} cl='download-button bold' enabled={ready} content={ready ? 'Descargar' : <VscLoading size={25} className='loadingIcon' />} />
                        </div>
                    </div>}
                {fail &&
                    <div className='fail' onClick={e => e.stopPropagation()}>
                        <h3>Hubo un error: {fail}</h3>
                        <p>Haz click fuera de la notificacion para esconder este mensaje...</p>
                    </div>
                }
            </div>
        </Modal>
    )
}

// CUADERNO PALABRA CLAVE

export default OutputScreen