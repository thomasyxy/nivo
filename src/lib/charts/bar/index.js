import { range, max, maxBy, sumBy, uniq } from 'lodash'
import { scaleBand, scaleLinear } from 'd3-scale'
import { stack } from 'd3-shape'

/**
 * Generates indexed scale.
 *
 * @param {Array.<Object>} data
 * @param {Function}       getIndex
 * @param {Array.<number>} range
 * @param {number}         padding
 * @returns {Function}
 */
export const getIndexedScale = (data, getIndex, range, padding) =>
    scaleBand().rangeRound(range).domain(data.map(getIndex)).padding(padding)

/**
 * Generates scale for grouped bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Array.<string>} keys
 * @param {Array.<number>} range
 * @returns {Function}
 */
export const getGroupedScale = (data, keys, range) => {
    const maxValue = max(data.reduce((acc, entry) => [...acc, ...keys.map(k => entry[k])], []))

    return scaleLinear().rangeRound(range).domain([0, maxValue])
}

/**
 * Generates scale for stacked bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Array.<string>} keys
 * @param {Array.<number>} range
 */
export const getStackedScale = (data, keys, range) => {
    const maxValue = max(data.map(d => sumBy(keys, key => d[key])))

    return scaleLinear().rangeRound(range).domain([0, maxValue])
}

/**
 * Generates x/y scales & bars for vertical grouped bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Function}       getIndex
 * @param {Array.<string>} keys
 * @param {number}         width
 * @param {number}         height
 * @param {Function}       color
 * @param {number}         xPadding
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateVerticalGroupedBars = (
    data,
    getIndex,
    keys,
    width,
    height,
    color,
    { xPadding = 0 } = {}
) => {
    const xScale = getIndexedScale(data, getIndex, [0, width], xPadding)
    const yScale = getGroupedScale(data, keys, [height, 0])

    const barWidth = xScale.bandwidth() / keys.length

    const bars = []
    if (barWidth > 0) {
        keys.forEach((key, i) => {
            range(xScale.domain().length).forEach(index => {
                const x = xScale(getIndex(data[index])) + barWidth * i
                const y = yScale(data[index][key])
                const barHeight = height - y

                if (barWidth > 0 && barHeight > 0) {
                    const barData = {
                        id: key,
                        value: data[index][key],
                        index,
                        indexValue: getIndex(data[index]),
                        data: data[index],
                    }

                    bars.push({
                        key: `${key}.${barData.indexValue}`,
                        data: barData,
                        x,
                        y,
                        width: barWidth,
                        height: barHeight,
                        color: color(barData),
                    })
                }
            })
        })
    }

    return { xScale, yScale, bars }
}

/**
 * Generates x/y scales & bars for horizontal grouped bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Function}       getIndex
 * @param {Array.<string>} keys
 * @param {number}         width
 * @param {number}         height
 * @param {Function}       color
 * @param {number}         xPadding
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateHorizontalGroupedBars = (
    data,
    getIndex,
    keys,
    width,
    height,
    color,
    { xPadding = 0 } = {}
) => {
    const xScale = getGroupedScale(data, keys, [0, width])
    const yScale = getIndexedScale(data, getIndex, [height, 0], xPadding)

    const barHeight = yScale.bandwidth() / keys.length

    const bars = []
    if (barHeight > 0) {
        keys.forEach((key, i) => {
            range(yScale.domain().length).forEach(index => {
                const x = 0
                const y = yScale(getIndex(data[index])) + barHeight * i
                const barWidth = xScale(data[index][key])

                if (barWidth > 0) {
                    const barData = {
                        id: key,
                        value: data[index][key],
                        index,
                        indexValue: getIndex(data[index]),
                        data: data[index],
                    }

                    bars.push({
                        key: `${key}.${barData.indexValue}`,
                        data: barData,
                        x,
                        y,
                        width: barWidth,
                        height: barHeight,
                        color: color(barData),
                    })
                }
            })
        })
    }

    return { xScale, yScale, bars }
}

/**
 * Generates x/y scales & bars for grouped bar chart.
 *
 * @param {string} layout
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateGroupedBars = (layout, ...args) =>
    layout === 'vertical'
        ? generateVerticalGroupedBars(...args)
        : generateHorizontalGroupedBars(...args)

/**
 * Generates x/y scales & bars for vertical stacked bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Function}       getIndex
 * @param {Array.<string>} keys
 * @param {number}         width
 * @param {number}         height
 * @param {Function}       getColor
 * @param {number}         xPadding
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateVerticalStackedBars = (
    data,
    getIndex,
    keys,
    width,
    height,
    getColor,
    { xPadding = 0 } = {}
) => {
    const xScale = getIndexedScale(data, getIndex, [0, width], xPadding)
    const yScale = getStackedScale(data, keys, [height, 0])

    const stackedData = stack().keys(keys)(data)

    const bars = []
    const barWidth = xScale.bandwidth()

    if (barWidth > 0) {
        stackedData.forEach(stackedDataItem => {
            xScale.domain().forEach((index, i) => {
                const d = stackedDataItem[i]
                const x = xScale(getIndex(d.data))

                const y = yScale(d[1])
                const barHeight = yScale(d[0]) - y

                if (barHeight > 0) {
                    const barData = {
                        id: stackedDataItem.key,
                        value: d.data[stackedDataItem.key],
                        index: i,
                        indexValue: index,
                        data: d.data,
                    }

                    bars.push({
                        key: `${stackedDataItem.key}.${index}`,
                        data: barData,
                        x,
                        y,
                        width: barWidth,
                        height: barHeight,
                        color: getColor(barData),
                    })
                }
            })
        })
    }

    return { xScale, yScale, bars }
}

/**
 * Generates x/y scales & bars for horizontal stacked bar chart.
 *
 * @param {Array.<Object>} data
 * @param {Function}       getIndex
 * @param {Array.<string>} keys
 * @param {number}         width
 * @param {number}         height
 * @param {Function}       getColor
 * @param {number}         xPadding
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateHorizontalStackedBars = (
    data,
    getIndex,
    keys,
    width,
    height,
    getColor,
    { xPadding = 0 } = {}
) => {
    const xScale = getStackedScale(data, keys, [0, width])
    const yScale = getIndexedScale(data, getIndex, [height, 0], xPadding)

    const stackedData = stack().keys(keys)(data)

    const bars = []
    const barHeight = yScale.bandwidth()

    if (barHeight > 0) {
        stackedData.forEach(stackedDataItem => {
            yScale.domain().forEach((index, i) => {
                const d = stackedDataItem[i]
                const y = yScale(getIndex(d.data))

                const barData = {
                    id: stackedDataItem.key,
                    value: d.data[stackedDataItem.key],
                    index: i,
                    indexValue: index,
                    data: d.data,
                }

                const x = xScale(d[0])
                const barWidth = xScale(d[1]) - x

                if (barWidth > 0) {
                    bars.push({
                        key: `${stackedDataItem.key}.${index}`,
                        data: barData,
                        x,
                        y,
                        width: barWidth,
                        height: barHeight,
                        color: getColor(barData),
                    })
                }
            })
        })
    }

    return { xScale, yScale, bars }
}

/**
 * Generates x/y scales & bars for stacked bar chart.
 *
 * @param {string} layout
 * @return {{ xScale: Function, yScale: Function, bars: Array.<Object> }}
 */
export const generateStackedBars = (layout, ...args) =>
    layout === 'vertical'
        ? generateVerticalStackedBars(...args)
        : generateHorizontalStackedBars(...args)
