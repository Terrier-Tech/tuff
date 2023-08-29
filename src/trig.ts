

const deg2rad = Math.PI/180

/**
 * @param deg an angle in degrees
 * @return the cosine of the angle
 */
function cos(deg: number): number {
    return Math.cos(deg * deg2rad)
}

/**
 * @param deg an angle in degrees
 * @return the sine of the angle
 */
function sin(deg: number): number {
    return Math.sin(deg * deg2rad)
}

/**
 * @param deg an angle in degrees
 * @return the tangent of the angle
 */
function tan(deg: number): number {
    return Math.tan(deg * deg2rad)
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

/**
 * These are just wrappers around the standard Math functions
 * that assume everything is in degrees.
 */
const Trig = {
    cos,
    sin,
    tan
}

export default Trig