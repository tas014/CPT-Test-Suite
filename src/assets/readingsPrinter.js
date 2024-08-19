import * as XLSX from 'xlsx'

const percentage = (num, perc) => {
    return (num/100)*perc
}

const nominal = 220;
const MinNom = percentage(nominal, 70);
const dataLine = 5;
const desvioMaximo = 18;
const minBreakpoint = 3;


const stackData = (readingsData) => {
    const data = parseFiles(readingsData);
    const keys = Object.keys(readingsData);
    const inter = setInterval(()=> {
        if (keys.length === data.length) {
            clearInterval(inter);
            const outputArr = [];
            data.forEach(arr => {
                outputArr.push({
                    name: arr.name,
                    rows: processFileData(arr.fileData[0])
                })
            })
            console.log(outputArr);
            prepareForPrinting(outputArr, data);
        } else {
            console.log('nope', data, keys.length);
        }
    }, 100)
}

const processFileData = arr => {
    const { fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm } = findFormatKeys(arr);

    const filteredArr = arr.filter((row, ind) => {
        //Check for the Abnormality property
        if (row[anorm] !== "A" && ind >= dataLine) {
            //Check for 15 min interval
            let logDiff = parseTime(row[hora]) - parseTime(arr[ind-1][hora]);

            //Check for instances under min nominal
            const parsedV = parseFloat(isOverMinNom(row, UV));
            if (!parsedV) {
                return false
            }
            //Check for 15 min interval
            if ((logDiff === 15 || logDiff === (-1425))) {
                row[UV] = parsedV;
                return true
            }
        }
    })

    return filteredArr
}

const prepareForPrinting = (arr, data) => {
    let output = [];
    const { UV } = findFormatKeys(data[0].fileData[0]);

    arr.forEach((obj, ind) => {
        const rows = [];
        const objKeys = Object.keys(obj.rows[0]);
        //console.log(objKeys);
        obj.rows.forEach(row => {
            const desvio = getDeviancy(row[UV]);
            rows.push({
                ENRE:arr[ind].name,
                desvio
            })
        })
        output.push(rows)
    })
    printWb(output.flat());
}

const printWb = arr => {
    const formattedRows = arr.map(row => prepareForOutput(row))
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const titles = ["NRO ENRE", "-18%", "-17%", "-16%", "-15%", "-14%", "-13%", "-12%", "-11%", "-10%", "-9%", "-8%", "-7%", "-6%", "-5%", "-4%", "-3%", "0%", "3%", "4%", "5%", "6%", "7%", "8%", "9%", "10%", "11%", "12%", "13%", "14%", "15%", "16%", "17%", "18%"];
    XLSX.utils.sheet_add_aoa(worksheet, [titles], { origin: "A1" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Output");
    worksheet["!cols"] = [];
    const max_width = formattedRows.reduce((w, r) => Math.max(w, " ENRE ".length), 10);
    for (let i=0; i < Object.keys(formattedRows[0]).length; i++) {
        worksheet["!cols"].push({ wch: max_width });
    }

    console.log(formattedRows, titles)
    XLSX.writeFile(workbook, "RES521-24.xlsx", { compression: true });
    //return workbook
}

const parseFiles = data => {
    const dataKeys = Object.keys(data);
    const outputArr = [];
    
    dataKeys.forEach(async e => {
        const dataArr = [];
        const parsed = await parseFileToJSON(data[e], true, dataArr);
        outputArr.push({
            name: parseFileName(data[e].name),
            fileData: dataArr,
        })
    })

    return outputArr
}

const prepareForOutput = row => {
    const temp_obj = {
        "ENRE": row.ENRE,
        "0": null
    }
    for (let i= 0 - desvioMaximo; i <= desvioMaximo ; i++) {
        if (i <= 0 - minBreakpoint || i >= minBreakpoint) {
            if (row.desvio === i) {
                temp_obj[(i).toString()] = "1";
            } else {
                temp_obj[(i).toString()] = null;
            }
        } else {
            if (row.desvio === i) {
                temp_obj["0"] = "1";
            }
        }
    }
    const keys = Object.keys(temp_obj);
    const outputObj = {};
    keys.sort((a, b) => {
        return parseInt(a) > parseInt(b);
    });
    keys.reverse();
    keys.forEach(key => {
        outputObj[key] = temp_obj[key];
    })

    const outputArr = [outputObj.ENRE];
    for (let i= 0 - desvioMaximo; i <= desvioMaximo ; i++) {
        const stringedI = i.toString();
        if (keys.includes(stringedI)) {
            outputArr.push(outputObj[stringedI])
        }
    }

    return outputArr
}

const parseFileToJSON = async (e, mult=false, targ) => {
    const reader = new FileReader();
    if (mult) {
        reader.readAsArrayBuffer(e)
    } else {
        reader.readAsArrayBuffer(e[0]);
    }
    reader.onload = p => {
        const data = p.target.result;
        const workbook = XLSX.read(data, {type:'binary'});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        targ.push(parsedData)
    }
}

const findFormatKeys = arr => {
    let fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm;
    const currentKeys = Object.keys(arr[dataLine]);
    currentKeys.forEach(k => {
        switch (arr[dataLine][k]) {
            case 'THD U':
                THDU = k
                break;
            case 'Fecha':
                fecha = k
                break;    
            case 'Hora':
                hora = k
                break;
            case 'U Max':
                UVMax = k
                break;
            case 'U Min':
                UVMin = k
                break;
            case 'U':
                UV = k
                break;
            case 'Flicker':
                flicker = k
                break;
            case 'Anormalidad':
                anorm = k
                break;    
            default:
                break;
        }
    })
    const checkArr = [fecha, hora, UV, UVMax, UVMin,/* THDU, flicker,*/ anorm]
    if (checkArr.includes(undefined)) {
        return false
    } else {
        return {
            fecha,
            hora,
            UV,
            UVMax,
            UVMin,
            THDU,
            flicker,
            anorm
        }
    }
}

const parseTime = time => {
    if (time) {
        const hour = parseInt(time.slice(0, time.indexOf(':')));
        const mins = parseInt(time.slice(time.indexOf(':')+1, time.length));
    
        return (hour * 60 + mins)
    }
}

const isOverMinNom = (row, nomKey) => {
    let fomrattedNum = row[nomKey].toString();
    if (row[nomKey] > 250) {
        if (fomrattedNum.length > 4) {
            fomrattedNum = fomrattedNum.slice(0, fomrattedNum.length - 2) + '.' + fomrattedNum.slice(fomrattedNum.length - 2);
        } else {
            fomrattedNum = fomrattedNum.slice(0, fomrattedNum.length - 1) + '.' + fomrattedNum.slice(fomrattedNum.length - 1);
        }
    }
    parseFloat(fomrattedNum);
    if (fomrattedNum < MinNom) {
        return false
    } else {
        return fomrattedNum
    }
}

const parseFileName = file => {
    const output = file.slice(0, file.indexOf('.'));
    return output
}

const getDeviancy = (num) => {
    const output = (num/nominal)*100-100
    if (Math.abs(output) > 18) {
        if(output >= 0) {
            return 18
        } else {
            return -18
        }
    }
    if (output >= 0) {
        return Math.floor(output);
    } else {
        return Math.ceil(output);
    }
}

export default stackData
