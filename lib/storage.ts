"use client"

// استبدال محاكاة قاعدة البيانات المعقدة بنظام تخزين محلي بسيط ومباشر

// نظام تخزين محلي بسيط للحاسبة
export interface CalculationRecord {
  id: string
  timestamp: Date
  side1: number
  side2: number
  hypotenuse: number
  area_m2: number
  area_labnah: number
}

export interface StorageData {
  calculations: CalculationRecord[]
  totalAreaM2: number
  totalAreaLabnah: number
  logs: string[]
}

class LocalStorageManager {
  private readonly STORAGE_KEY = "triangle_calculator_data"

  private getDefaultData(): StorageData {
    return {
      calculations: [],
      totalAreaM2: 0,
      totalAreaLabnah: 0,
      logs: [],
    }
  }

  getData(): StorageData {
    if (typeof window === "undefined") return this.getDefaultData()

    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return this.getDefaultData()

      const parsed = JSON.parse(data)
      // تحويل التواريخ من نص إلى كائن Date
      parsed.calculations = parsed.calculations.map((calc: any) => ({
        ...calc,
        timestamp: new Date(calc.timestamp),
      }))

      return parsed
    } catch (error) {
      console.error("خطأ في قراءة البيانات:", error)
      return this.getDefaultData()
    }
  }

  saveData(data: StorageData): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("خطأ في حفظ البيانات:", error)
    }
  }

  addCalculation(calculation: Omit<CalculationRecord, "id">): void {
    const data = this.getData()
    const newCalculation: CalculationRecord = {
      ...calculation,
      id: Date.now().toString(),
    }

    data.calculations.unshift(newCalculation) // إضافة في المقدمة

    // إضافة سجل للعملية
    const logEntry = `حساب جديد: الأضلاع (${calculation.side1}, ${calculation.side2}, ${calculation.hypotenuse}) - المساحة: ${calculation.area_m2.toFixed(4)} متر مربع = ${calculation.area_labnah.toFixed(6)} لبنة`
    data.logs.unshift(logEntry)

    this.saveData(data)
  }

  updateTotals(totalM2: number, totalLabnah: number): void {
    const data = this.getData()
    data.totalAreaM2 = totalM2
    data.totalAreaLabnah = totalLabnah

    // إضافة سجل للإضافة
    const logEntry = `تم إضافة للإجمالي - الإجمالي الحالي: ${totalM2.toFixed(4)} متر مربع`
    data.logs.unshift(logEntry)

    this.saveData(data)
  }

  addLog(message: string): void {
    const data = this.getData()
    data.logs.unshift(message)

    // الاحتفاظ بآخر 100 سجل فقط
    if (data.logs.length > 100) {
      data.logs = data.logs.slice(0, 100)
    }

    this.saveData(data)
  }

  clearAll(): void {
    const data = this.getDefaultData()
    data.logs.push("تم مسح جميع البيانات")
    this.saveData(data)
  }

  exportData(): string {
    const data = this.getData()
    return JSON.stringify(data, null, 2)
  }

  getStatistics() {
    const data = this.getData()
    const calculations = data.calculations

    if (calculations.length === 0) {
      return {
        totalCalculations: 0,
        averageAreaM2: 0,
        averageAreaLabnah: 0,
        lastCalculation: null,
      }
    }

    const totalAreaM2 = calculations.reduce((sum, calc) => sum + calc.area_m2, 0)
    const totalAreaLabnah = calculations.reduce((sum, calc) => sum + calc.area_labnah, 0)

    return {
      totalCalculations: calculations.length,
      averageAreaM2: totalAreaM2 / calculations.length,
      averageAreaLabnah: totalAreaLabnah / calculations.length,
      lastCalculation: calculations[0]?.timestamp || null,
    }
  }
}

export const storageManager = new LocalStorageManager()
