import * as XLSX from 'xlsx'

const percentage = (num, perc) => {
    return (num / 100) * perc
}
const percentageOfB = (a, b) => {
    return Math.abs((a / b) * 100)
}

const nominal = 220;
const MinNom = percentage(nominal, 70);
const dataLine = 5;
const desvioMaximo = 18;
const minBreakpoint = 3;
const minReadings = 480;
const compactBreakpoint = 8;


const stackData = (readingsData, format = true) => {
    const data = parseFiles(readingsData);
    const keys = Object.keys(readingsData);
    const prom = new Promise((res, rej) => {
        const inter = setInterval(() => {
            if (keys.length === data.length) {
                clearInterval(inter);
                const outputArr = [];
                setTimeout(() => {
                    data.forEach((arr, ind) => {
                        if (arr.fileData.length !== 0) {
                            outputArr.push({
                                name: arr.name,
                                rows: processFileData(arr.fileData[0])
                            })
                        } else {
                            //console.log(`File ${arr.name} came out empty at position ${ind}.`)
                        }
                    })
                    const printData = prepareForPrinting(outputArr, data, format);
                    res(printData)
                }, 200)
            }
        }, 100)
    })
    return prom
}

const processFileData = arr => {
    const { fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm } = findFormatKeys(arr);

    const filteredArr = arr.filter((row, ind) => {
        //Check for the Abnormality property
        if (row[anorm] !== "A" && ind >= dataLine) {
            //Check for 15 min interval
            let logDiff = parseTime(row[hora]) - parseTime(arr[ind - 1][hora]);

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

const prepareForPrinting = (arr, data, format) => {
    let output = [];
    const auxArr = [];
    const { UV } = findFormatKeys(data[0].fileData[0]);

    arr.forEach((obj, ind) => {
        const rows = [];

        if (format) {
            obj.rows.forEach(row => {
                const desvio = getDeviancy(row[UV]);
                rows.push({
                    ENRE: arr[ind].name,
                    desvio,
                    UV: row[UV]
                })
            })
            output.push(rows);
        } else {
            const desvio = getCompactDeviancy(obj.rows, UV);
            const isValid = assessValidity(obj.rows);
            const penalizedRegistries = getPenalizedRegistries(obj.rows, UV);
            const compactOutput = {
                ENRE: obj.name,
                desvio,
                totalRegistries: obj.rows.length,
                penalizedRegistries,
                isValid,
                isPenalized: assessPenalized(penalizedRegistries, obj.rows.length)
            }
            auxArr.push(compactOutput);
        }
    })
    if (format) {
        return output.flat();
    } else {
        return auxArr
    }
}

const getCompactDeviancy = (arr, UV) => {
    const outputObj = {
        "0": 0
    }
    for (let i = compactBreakpoint; i <= desvioMaximo; i++) {
        outputObj[i] = 0;
    }
    const keys = Object.keys(outputObj);
    arr.forEach(row => {
        const desvio = Math.abs(getDeviancy(row[UV]))
        if (keys.includes(desvio.toString())) {
            outputObj[desvio.toString()]++
        } else {
            outputObj["0"]++
        }
    })
    return outputObj
}

const assessValidity = (arr) => {
    return arr.length >= minReadings
}

const getPenalizedRegistries = (arr, UV) => {
    let count = 0;
    arr.forEach(row => {
        const deviancy = Math.abs(getDeviancy(row[UV]));
        if (deviancy >= 8) {
            count++
        }
    })
    return count
}

const assessPenalized = (penalized, total) => {
    return percentageOfB(penalized, total) > 3
}

const printWb = (arr, type = true) => {
    let formattedRows, titles, max_width;
    const workbook = XLSX.utils.book_new();

    if (type) {
        formattedRows = arr.map(row => prepareForCompleteOutput(row))
    } else {
        formattedRows = arr.map(row => prepareForCompactOutput(row))
    }

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);

    if (type) {
        titles = ["NRO ENRE", "Tension", "-18%", "-17%", "-16%", "-15%", "-14%", "-13%", "-12%", "-11%", "-10%", "-9%", "-8%", "-7%", "-6%", "-5%", "-4%", "-3%", "0%", "3%", "4%", "5%", "6%", "7%", "8%", "9%", "10%", "11%", "12%", "13%", "14%", "15%", "16%", "17%", "18%"];
        max_width = formattedRows.reduce((w, r) => Math.max(w, " ENRE ".length), 10);
    } else {
        titles = ["NRO ENRE", "0% a 7%", "8%", "9%", "10%", "11%", "12%", "13%", "14%", "15%", "16%", "17%", "18%", "Total Registros", "Registros Penalizados", "Medición Valida", "Medición Penalizada"];
        max_width = formattedRows.reduce((w, r) => Math.max(w, "Registros Penalizados".length), 10);
    }
    XLSX.utils.sheet_add_aoa(worksheet, [titles], { origin: "A1" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Output");
    worksheet["!cols"] = [];
    for (let i = 0; i < Object.keys(formattedRows[0]).length; i++) {
        worksheet["!cols"].push({ wch: max_width });
    }

    XLSX.writeFile(workbook, "RES521-24.xlsx", { compression: true });
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

const prepareForCompleteOutput = row => {
    const temp_obj = {
        "ENRE": row.ENRE,
        "0": null
    }
    for (let i = 0 - desvioMaximo; i <= desvioMaximo; i++) {
        if (i <= 0 - minBreakpoint || i >= minBreakpoint) {
            if (row.desvio === i) {
                temp_obj[(i).toString()] = 1;
            } else {
                temp_obj[(i).toString()] = null;
            }
        } else {
            if (row.desvio === i) {
                temp_obj["0"] = 1;
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

    const outputArr = [row.ENRE, row.UV];
    for (let i = 0 - desvioMaximo; i <= desvioMaximo; i++) {
        const stringedI = i.toString();
        if (keys.includes(stringedI)) {
            outputArr.push(outputObj[stringedI])
        }
    }

    return outputArr
}

const prepareForCompactOutput = row => {
    const deviancyKeys = Object.keys(row.desvio);
    const outputArr = [row.ENRE];

    deviancyKeys.forEach(key => {
        outputArr.push(row.desvio[key])
    })
    if (!row.isValid) {
        row.isPenalized = '-'
    }
    outputArr.push(row.totalRegistries, row.penalizedRegistries, row.isValid, row.isPenalized)

    return outputArr
}

const parseFileToJSON = async (e, mult = false, targ) => {
    const reader = new FileReader();
    if (mult) {
        reader.readAsArrayBuffer(e)
    } else {
        reader.readAsArrayBuffer(e[0]);
    }
    reader.onload = p => {
        const data = p.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
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
        const mins = parseInt(time.slice(time.indexOf(':') + 1, time.length));

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
    const output = (num / nominal) * 100 - 100
    if (Math.abs(output) > 18) {
        if (output >= 0) {
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

export { stackData, printWb }
