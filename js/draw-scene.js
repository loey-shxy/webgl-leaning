function drawScene(gl, programInfo, buffers, texture, cubeRotation) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0) // clear to black, fully opaque
  gl.clearDepth(1.0) // Clear everything
  gl.enable(gl.DEPTH_TEST) // Enable depth testing
  gl.depthFunc(gl.LEQUAL) // Near things obscure far things

  // Clear the canvas before we start drawing on it
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  /**
   * 创建一个透视矩阵，一个用来模拟相机的透视失真的特殊矩阵。
   */
  const fieldOfview = 45 * Math.PI / 180
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight // 透视矩阵宽/高比
  const zNear = 0.1 // 最近距离
  const zFar = 100 // 最远距离

  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, fieldOfview, aspect, zNear, zFar)

  // 设置场景中心点
  const modelViewMatrix = mat4.create()
  // 将绘图位置移到我们想要开始绘制正方形的位置。
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])

  // 旋转
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3, [1, 0, 0])

  setPositionAttribute(gl, buffers, programInfo)
  // setColorAttribute(gl, buffers, programInfo)
  setTextureAttribute(gl, buffers, programInfo)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

  // 告诉WebGL在绘图时使用我们的程序
  gl.useProgram(programInfo.program)

  // 设置着色器 uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  )
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  )

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);


  {
    const vertexCount = 36
    const offset = 0
    const type = gl.UNSIGNED_SHORT
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    // gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
  }

}

// 告诉 WebGL 如何从位置中提取坐标
// 缓冲区到 vertexPosition 属性
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 3 // 每次迭代取出3个值
  const type = gl.FLOAT // 缓冲区中的数据是32位浮点数

  const normalize = false
  const stride = 0 // 从一组值到下一组值需要多少字节
                    // 0 为使用上面的type和numComponents

  const offset = 0 // 从缓冲区内多少字节开始
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  )

  gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexPosition
  )
}

function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  )

  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
}

// 告诉 WebGL 如何从缓冲区中提取纹理坐标
function setTextureAttribute(gl, buffers, programInfo) {
  const num = 2; // 每个坐标由 2 个值组成
  const type = gl.FLOAT; // 缓冲区中的数据为 32 位浮点数
  const normalize = false; // 不做标准化处理
  const stride = 0; // 从一个坐标到下一个坐标要获取多少字节
  const offset = 0; // 从缓冲区内的第几个字节开始获取数据
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    num,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}


export { drawScene }