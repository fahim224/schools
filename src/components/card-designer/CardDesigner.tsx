'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'

const STANDARD_WIDTH = 1012
const STANDARD_HEIGHT = 638

export default function CardDesigner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)

  const [width, setWidth] = useState(STANDARD_WIDTH)
  const [height, setHeight] = useState(STANDARD_HEIGHT)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
    })

    fabricRef.current = canvas

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && fabricRef.current) {
        const active = fabricRef.current.getActiveObject()
        if (active) fabricRef.current.remove(active)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
    }
  }, [])

  const updateCanvasSize = () => {
    if (!fabricRef.current) return
    fabricRef.current.setWidth(width)
    fabricRef.current.setHeight(height)
    fabricRef.current.renderAll()
  }

  const addText = () => {
    if (!fabricRef.current) return
    const text = new fabric.IText('نام شاگرد', {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: '#000',
    })
    fabricRef.current.add(text)
    fabricRef.current.setActiveObject(text)
  }

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return

    const reader = new FileReader()
    reader.onload = () => {
      fabric.Image.fromURL(reader.result as string, (img) => {
        img.set({
          left: 200,
          top: 150,
          scaleX: 0.5,
          scaleY: 0.5,
        })
        fabricRef.current?.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const addRectangle = () => {
    if (!fabricRef.current) return
    const rect = new fabric.Rect({
      left: 150,
      top: 150,
      fill: '#3b82f6',
      width: 200,
      height: 100,
      rx: 10,
      ry: 10,
    })
    fabricRef.current.add(rect)
  }

  const addCircle = () => {
    if (!fabricRef.current) return
    const circle = new fabric.Circle({
      left: 200,
      top: 200,
      radius: 60,
      fill: '#10b981',
    })
    fabricRef.current.add(circle)
  }

  const addLine = () => {
    if (!fabricRef.current) return
    const line = new fabric.Line([50, 50, 400, 50], {
      stroke: '#ef4444',
      strokeWidth: 5,
    })
    fabricRef.current.add(line)
  }

  const deleteSelected = () => {
    if (!fabricRef.current) return
    const active = fabricRef.current.getActiveObject()
    if (active) fabricRef.current.remove(active)
  }

  const exportPNG = () => {
    if (!fabricRef.current) return
    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
    })
    const link = document.createElement('a')
    link.href = dataURL
    link.download = 'id-card.png'
    link.click()
  }

return (
  <div className={darkMode ? "dark" : ""}>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Card Designer
          </h1>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm dark:text-white"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Paper Size Settings */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-wrap gap-4 items-end">

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              عرض
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-1 w-28 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              ارتفاع
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-1 w-28 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={updateCanvasSize}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            اعمال اندازه
          </button>

          <button
            onClick={() => {
              setWidth(STANDARD_WIDTH)
              setHeight(STANDARD_HEIGHT)
              setTimeout(updateCanvasSize, 0)
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            اندازه استاندارد
          </button>

        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="w-full lg:w-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow space-y-3">

            <h2 className="font-semibold text-gray-700 dark:text-gray-300">
              ابزارها
            </h2>

            <button onClick={addText} className="btn">افزودن متن</button>

            <label className="btn cursor-pointer block text-center">
              افزودن عکس
              <input type="file" accept="image/*" onChange={addImage} hidden />
            </label>

            <button onClick={addRectangle} className="btn">افزودن مستطیل</button>
            <button onClick={addCircle} className="btn">افزودن دایره</button>
            <button onClick={addLine} className="btn">افزودن خط</button>
            <button onClick={deleteSelected} className="btn">حذف انتخاب شده</button>
            <button onClick={exportPNG} className="btn">خروجی PNG</button>

          </div>

          {/* Canvas */}
          <div className="flex-1 flex justify-center items-center overflow-auto">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <canvas ref={canvasRef} />
            </div>
          </div>

        </div>

      </div>

    </div>

    <style jsx global>{`
      .btn {
        width: 100%;
        padding: 8px 12px;
        border-radius: 8px;
        background: #e5e7eb;
        transition: 0.2s;
      }
      .btn:hover {
        background: #d1d5db;
      }
      .dark .btn {
        background: #374151;
        color: white;
      }
      .dark .btn:hover {
        background: #4b5563;
      }
    `}</style>

  </div>
)
}