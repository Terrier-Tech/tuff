/// These are just wrappers around the standard Math functions
/// that assume everything is in degrees.

const deg2rad = Math.PI/180

export function cos(deg: number): number {
    return Math.cos(deg * deg2rad)
}

export function sin(deg: number): number {
    return Math.sin(deg * deg2rad)
}

export function tan(deg: number): number {
    return Math.tan(deg * deg2rad)
}