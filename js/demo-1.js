import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let cubeRotation = 0.0
let deltaTime = 0

main()
function main() {
  /**
   * 顶点着色器
   * 在形状中的每个顶点运行
   * 它的工作是将输入顶点从原始坐标系转换到 WebGL 使用的裁剪空间坐标系
   */
  // const vsSource = `
  // attribute vec4 aVertexPosition;
  // attribute vec4 aVertexColor;

  // uniform mat4 uModelViewMatrix;
  // uniform mat4 uProjectionMatrix;

  // varying lowp vec4 vColor;

  // void main() {
  //   gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  //   vColor = aVertexColor;
  // }
  // `;
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;


  /**
  * 片段着色器
  * 在顶点着色器处理完图形的顶点后，会被要绘制的每个图形的每个像素点调用一次
  * 它的职责是确定像素的颜色，通过指定应用到像素的纹理元素，获取纹理元素的颜色，然后将适当的光照应用于颜色。之后颜色存储在特殊变量 gl_FragColor 中，返回到 WebGL 层，该颜色将最终绘制到屏幕上图形对应像素的对应位置
  */
  // const fsSource = `
  // varying lowp vec4 vColor;

  // void main(void) {
  //   gl_FragColor = vColor;
  // }
  // `;
  const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;


  const canvas = document.getElementById('glcanvas')
  const gl = canvas.getContext('webgl')

  if (!gl) {
    alert('无法初始化 WebGL, 你的浏览器、操作系统或硬件等可能不支持WebGL。')
    return
  }

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      // vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
    }
  }

  const buffers = initBuffers(gl)
  const texture = loadTexture(gl, '../images/texture.png')

  // 调用 pixelStorei() 将 gl.UNPACK_FLIP_Y_WEBGL 设置为 true, 以调整像素顺序
  // 使其翻转为 webgl 需要的自下而上的顺序
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  let then = 0

  function render(now) {
    now *= 0.001
    deltaTime = now - then
    then = now
    drawScene(gl, programInfo, buffers, texture, cubeRotation)
    cubeRotation += deltaTime
    
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}


// 初始化着色器程序，让 WebGL 知道如何绘制我们的数据
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // 创建着色器程序
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: '+ gl.getProgramInfoLog(shaderProgram))
    return null
  }

  return shaderProgram
}

function loadShader(gl, type, source) {
  // 创建着色器
  const shader = gl.createShader(type)
  
  // 将源代码发送到着色器
  gl.shaderSource(shader, source)

  // 编译
  gl.compileShader(shader)

  // 判断是否成功编译了着色器
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

// 加载纹理
function loadTexture(gl, url) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const level = 0
  const internalFormat = gl.RGBA
  const width = 1
  const height = 1
  const border = 0
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  const pixel = new Uint8Array([0, 0, 255, 255])

  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  )

  /**
   * WebGL1 中，对于非 2 的幂纹理只能使用 NEAREST 和 LINEAR 过滤，且不会生成贴图
   * 根据下载的图像在两个维度上是否为 2 的幂来设置纹理的过滤（filter）和平铺（wrap）。
   * 浏览器会从加载的图像中按从左上角开始的自上而下顺序复制像素，而 WebGL 需要按自下而上的顺序——从左下角开始的像素顺序
   */
  const image = new Image()
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture) // 绑定纹理
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    )

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
  }

  image.src = url
  return texture
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0
}