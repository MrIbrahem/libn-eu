"use client"

// Database interface for Triangle Area Calculator
// This module handles all SQLite database operations

export interface CalculationRecord {
  id?: number
  timestamp: Date
  side1: number
  side2: number
  hypotenuse: number
  area_m2: number
  area_labnah: number
  session_id: string
}

export interface CalculationLog {
  id?: number
  calculation_id?: number
  log_type: "calculation" | "add_to_total" | "error"
  message: string
  timestamp: Date
}

export interface TotalRecord {
  id?: number
  session_id: string
  total_area_m2: number
  total_area_labnah: number
  last_updated: Date
}

class DatabaseManager {
  private db: any = null
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initDatabase()
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async initDatabase() {
    try {
      // In a real implementation, you would use a proper SQLite library
      // For now, we'll simulate with localStorage as a fallback
      if (typeof window !== "undefined") {
        // Initialize database structure in localStorage
        const dbStructure = {
          calculations: [],
          calculation_logs: [],
          totals: [],
        }

        if (!localStorage.getItem("triangle_calculator_db")) {
          localStorage.setItem("triangle_calculator_db", JSON.stringify(dbStructure))
        }
      }
    } catch (error) {
      console.error("Failed to initialize database:", error)
    }
  }

  private getDatabase() {
    if (typeof window === "undefined") return null

    try {
      const dbData = localStorage.getItem("triangle_calculator_db")
      return dbData ? JSON.parse(dbData) : { calculations: [], calculation_logs: [], totals: [] }
    } catch (error) {
      console.error("Failed to get database:", error)
      return { calculations: [], calculation_logs: [], totals: [] }
    }
  }

  private saveDatabase(db: any) {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("triangle_calculator_db", JSON.stringify(db))
    } catch (error) {
      console.error("Failed to save database:", error)
    }
  }

  async saveCalculation(calculation: Omit<CalculationRecord, "id" | "session_id">): Promise<number> {
    const db = this.getDatabase()
    if (!db) return -1

    const newCalculation: CalculationRecord = {
      ...calculation,
      id: Date.now(),
      session_id: this.sessionId,
      timestamp: new Date(calculation.timestamp),
    }

    db.calculations.push(newCalculation)
    this.saveDatabase(db)

    // Log the calculation
    await this.saveLog({
      calculation_id: newCalculation.id,
      log_type: "calculation",
      message: `حساب جديد: الأضلاع (${calculation.side1}, ${calculation.side2}, ${calculation.hypotenuse}) - المساحة: ${calculation.area_m2.toFixed(4)} متر مربع = ${calculation.area_labnah.toFixed(6)} لبنة`,
      timestamp: new Date(),
    })

    return newCalculation.id!
  }

  async saveLog(log: Omit<CalculationLog, "id">): Promise<void> {
    const db = this.getDatabase()
    if (!db) return

    const newLog: CalculationLog = {
      ...log,
      id: Date.now() + Math.random(),
      timestamp: new Date(log.timestamp),
    }

    db.calculation_logs.push(newLog)
    this.saveDatabase(db)
  }

  async updateTotals(totalM2: number, totalLabnah: number): Promise<void> {
    const db = this.getDatabase()
    if (!db) return

    const existingTotalIndex = db.totals.findIndex((t: TotalRecord) => t.session_id === this.sessionId)

    const totalRecord: TotalRecord = {
      session_id: this.sessionId,
      total_area_m2: totalM2,
      total_area_labnah: totalLabnah,
      last_updated: new Date(),
    }

    if (existingTotalIndex >= 0) {
      totalRecord.id = db.totals[existingTotalIndex].id
      db.totals[existingTotalIndex] = totalRecord
    } else {
      totalRecord.id = Date.now()
      db.totals.push(totalRecord)
    }

    this.saveDatabase(db)
  }

  async getCalculations(sessionId?: string): Promise<CalculationRecord[]> {
    const db = this.getDatabase()
    if (!db) return []

    const targetSessionId = sessionId || this.sessionId
    return db.calculations
      .filter((calc: CalculationRecord) => calc.session_id === targetSessionId)
      .map((calc: any) => ({
        ...calc,
        timestamp: new Date(calc.timestamp),
      }))
      .sort(
        (a: CalculationRecord, b: CalculationRecord) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  }

  async getAllCalculations(): Promise<CalculationRecord[]> {
    const db = this.getDatabase()
    if (!db) return []

    return db.calculations
      .map((calc: any) => ({
        ...calc,
        timestamp: new Date(calc.timestamp),
      }))
      .sort(
        (a: CalculationRecord, b: CalculationRecord) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  }

  async getLogs(calculationId?: number): Promise<CalculationLog[]> {
    const db = this.getDatabase()
    if (!db) return []

    let logs = db.calculation_logs

    if (calculationId) {
      logs = logs.filter((log: CalculationLog) => log.calculation_id === calculationId)
    }

    return logs
      .map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }))
      .sort((a: CalculationLog, b: CalculationLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async getSessionLogs(): Promise<string> {
    const logs = await this.getLogs()
    const sessionCalculations = await this.getCalculations()

    const sessionLogIds = sessionCalculations.map((calc) => calc.id)
    const sessionLogs = logs.filter((log) => !log.calculation_id || sessionLogIds.includes(log.calculation_id))

    return sessionLogs.map((log) => log.message).join("\n")
  }

  async getTotals(): Promise<TotalRecord | null> {
    const db = this.getDatabase()
    if (!db) return null

    const total = db.totals.find((t: TotalRecord) => t.session_id === this.sessionId)

    if (total) {
      return {
        ...total,
        last_updated: new Date(total.last_updated),
      }
    }

    return null
  }

  async clearSession(): Promise<void> {
    const db = this.getDatabase()
    if (!db) return

    // Remove calculations for current session
    db.calculations = db.calculations.filter((calc: CalculationRecord) => calc.session_id !== this.sessionId)

    // Remove logs for current session calculations
    const sessionCalculationIds = db.calculations
      .filter((calc: CalculationRecord) => calc.session_id === this.sessionId)
      .map((calc: CalculationRecord) => calc.id)

    db.calculation_logs = db.calculation_logs.filter(
      (log: CalculationLog) => !log.calculation_id || !sessionCalculationIds.includes(log.calculation_id),
    )

    // Remove totals for current session
    db.totals = db.totals.filter((total: TotalRecord) => total.session_id !== this.sessionId)

    this.saveDatabase(db)

    // Log the clear action
    await this.saveLog({
      log_type: "add_to_total",
      message: "تم مسح جميع البيانات المحفوظة",
      timestamp: new Date(),
    })
  }

  async clearAllData(): Promise<void> {
    if (typeof window === "undefined") return

    const dbStructure = {
      calculations: [],
      calculation_logs: [],
      totals: [],
    }

    localStorage.setItem("triangle_calculator_db", JSON.stringify(dbStructure))
  }

  async exportData(): Promise<string> {
    const db = this.getDatabase()
    if (!db) return "{}"

    return JSON.stringify(db, null, 2)
  }

  async getStatistics(): Promise<{
    totalCalculations: number
    totalSessions: number
    averageAreaM2: number
    averageAreaLabnah: number
    lastCalculation: Date | null
  }> {
    const allCalculations = await this.getAllCalculations()

    if (allCalculations.length === 0) {
      return {
        totalCalculations: 0,
        totalSessions: 0,
        averageAreaM2: 0,
        averageAreaLabnah: 0,
        lastCalculation: null,
      }
    }

    const uniqueSessions = new Set(allCalculations.map((calc) => calc.session_id))
    const totalAreaM2 = allCalculations.reduce((sum, calc) => sum + calc.area_m2, 0)
    const totalAreaLabnah = allCalculations.reduce((sum, calc) => sum + calc.area_labnah, 0)

    return {
      totalCalculations: allCalculations.length,
      totalSessions: uniqueSessions.size,
      averageAreaM2: totalAreaM2 / allCalculations.length,
      averageAreaLabnah: totalAreaLabnah / allCalculations.length,
      lastCalculation: allCalculations[0]?.timestamp || null,
    }
  }

  getSessionId(): string {
    return this.sessionId
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager()
