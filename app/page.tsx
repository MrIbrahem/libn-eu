"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Copy,
  Facebook,
  Instagram,
  MessageCircle,
  Calculator,
  History,
  Info,
  Database,
  Download,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storageManager, type CalculationRecord } from "@/lib/storage"

export default function TriangleCalculator() {
  const [activeTab, setActiveTab] = useState("home")
  const [side1, setSide1] = useState("")
  const [side2, setSide2] = useState("")
  const [hypotenuse, setHypotenuse] = useState("")
  const [calculationLog, setCalculationLog] = useState("")
  const [currentAreaM2, setCurrentAreaM2] = useState(0)
  const [currentAreaLabnah, setCurrentAreaLabnah] = useState(0)
  const [totalAreaM2, setTotalAreaM2] = useState(0)
  const [totalAreaLabnah, setTotalAreaLabnah] = useState(0)
  const [history, setHistory] = useState<CalculationRecord[]>([])
  const [error, setError] = useState("")
  const [statistics, setStatistics] = useState({
    totalCalculations: 0,
    totalSessions: 0,
    averageAreaM2: 0,
    averageAreaLabnah: 0,
    lastCalculation: null as Date | null,
  })
  const { toast } = useToast()

  // Load data from database on component mount
  useEffect(() => {
    loadDataFromStorage()
  }, [])

  const loadDataFromStorage = () => {
    try {
      const data = storageManager.getData()
      setHistory(data.calculations)
      setTotalAreaM2(data.totalAreaM2)
      setTotalAreaLabnah(data.totalAreaLabnah)
      setCalculationLog(data.logs.join("\n"))

      const stats = storageManager.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error)
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل البيانات المحفوظة",
        variant: "destructive",
      })
    }
  }

  const validateTriangle = (a: number, b: number, c: number): boolean => {
    return a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a
  }

  const calculateArea = (a: number, b: number, c: number): number => {
    const s = (a + b + c) / 2
    return Math.sqrt(s * (s - a) * (s - b) * (s - c))
  }

  const handleCalculate = () => {
    const a = Number.parseFloat(side1)
    const b = Number.parseFloat(side2)
    const c = Number.parseFloat(hypotenuse)

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setError("يرجى إدخال قيم صحيحة لجميع الأضلاع")
      storageManager.addLog("خطأ: قيم غير صحيحة للأضلاع")
      return
    }

    if (!validateTriangle(a, b, c)) {
      setError("القيم المدخلة لا تشكل مثلثاً صحيحاً")
      storageManager.addLog("خطأ: القيم المدخلة لا تشكل مثلثاً صحيحاً")
      return
    }

    setError("")
    const areaM2 = calculateArea(a, b, c)
    const areaLabnah = areaM2 / 44.4444

    setCurrentAreaM2(areaM2)
    setCurrentAreaLabnah(areaLabnah)

    // حفظ العملية
    storageManager.addCalculation({
      timestamp: new Date(),
      side1: a,
      side2: b,
      hypotenuse: c,
      area_m2: areaM2,
      area_labnah: areaLabnah,
    })

    // تحديث البيانات
    loadDataFromStorage()

    toast({
      title: "تم الحساب بنجاح",
      description: "تم حفظ النتيجة محلياً",
    })
  }

  const handleAddToTotal = () => {
    if (currentAreaM2 > 0) {
      const newTotalM2 = totalAreaM2 + currentAreaM2
      const newTotalLabnah = totalAreaLabnah + currentAreaLabnah

      setTotalAreaM2(newTotalM2)
      setTotalAreaLabnah(newTotalLabnah)

      storageManager.updateTotals(newTotalM2, newTotalLabnah)
      loadDataFromStorage()

      toast({
        title: "تم الإضافة بنجاح",
        description: "تم إضافة المساحة للإجمالي",
      })
    }
  }

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${label} للحافظة`,
      })
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم يتم نسخ القيمة",
        variant: "destructive",
      })
    }
  }

  const clearHistory = () => {
    storageManager.clearAll()

    setHistory([])
    setTotalAreaM2(0)
    setTotalAreaLabnah(0)
    setCalculationLog("")
    setCurrentAreaM2(0)
    setCurrentAreaLabnah(0)

    loadDataFromStorage()

    toast({
      title: "تم مسح السجل",
      description: "تم مسح جميع البيانات المحفوظة",
    })
  }

  const exportData = () => {
    try {
      const data = storageManager.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `triangle-calculator-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير البيانات إلى ملف JSON",
      })
    } catch (error) {
      console.error("خطأ في التصدير:", error)
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">حساب مساحة المثلثات (لبنة)</h1>
          <p className="text-gray-600">حاسبة دقيقة لمساحة المثلثات بالوحدات اليمنية مع قاعدة بيانات SQLite</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              الرئيسية
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              السجل
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              عن التطبيق
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  إحصائيات البيانات المحفوظة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{statistics.totalCalculations}</div>
                    <div className="text-gray-600">إجمالي العمليات</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{statistics.totalSessions}</div>
                    <div className="text-gray-600">عدد الجلسات</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{statistics.averageAreaM2.toFixed(2)}</div>
                    <div className="text-gray-600">متوسط المساحة (م²)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{statistics.averageAreaLabnah.toFixed(4)}</div>
                    <div className="text-gray-600">متوسط المساحة (لبنة)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Log */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل العمليات الحسابية</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={exportData} variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                    تصدير البيانات
                  </Button>
                  <Button onClick={clearHistory} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                    مسح السجل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={calculationLog}
                  readOnly
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="سيظهر هنا سجل العمليات الحسابية من قاعدة البيانات..."
                />
              </CardContent>
            </Card>

            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>إدخال أضلاع المثلث</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="side1">الضلع 1 (يمين)</Label>
                    <Input
                      id="side1"
                      type="number"
                      value={side1}
                      onChange={(e) => setSide1(e.target.value)}
                      placeholder="أدخل طول الضلع الأول"
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor="side2">الضلع 2 (يسار)</Label>
                    <Input
                      id="side2"
                      type="number"
                      value={side2}
                      onChange={(e) => setSide2(e.target.value)}
                      placeholder="أدخل طول الضلع الثاني"
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hypotenuse">الوتر (قاعدة)</Label>
                    <Input
                      id="hypotenuse"
                      type="number"
                      value={hypotenuse}
                      onChange={(e) => setHypotenuse(e.target.value)}
                      placeholder="أدخل طول الوتر"
                      className="text-center"
                    />
                  </div>
                </div>

                {error && <div className="text-red-600 text-center bg-red-50 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4 justify-center">
                  <Button onClick={handleCalculate} className="bg-blue-600 hover:bg-blue-700">
                    حساب
                  </Button>
                  <Button onClick={handleAddToTotal} variant="outline" disabled={currentAreaM2 === 0}>
                    أضف للإجمالي
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>نتيجة الحساب الحالي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>المساحة بالمتر المربع:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded">{currentAreaM2.toFixed(4)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(currentAreaM2.toFixed(4), "المساحة بالمتر المربع")}
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>المساحة باللبنة:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded">{currentAreaLabnah.toFixed(6)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(currentAreaLabnah.toFixed(6), "المساحة باللبنة")}
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إجمالي مساحة المثلثات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>الإجمالي بالمتر المربع:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-green-100 px-3 py-1 rounded">{totalAreaM2.toFixed(4)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(totalAreaM2.toFixed(4), "الإجمالي بالمتر المربع")}
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الإجمالي باللبنة:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-green-100 px-3 py-1 rounded">{totalAreaLabnah.toFixed(6)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(totalAreaLabnah.toFixed(6), "الإجمالي باللبنة")}
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل العمليات السابقة من قاعدة البيانات</CardTitle>
                <Button onClick={loadDataFromStorage} variant="outline" size="sm">
                  <Database className="w-4 h-4" />
                  تحديث البيانات
                </Button>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد عمليات محفوظة في قاعدة البيانات</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((calc) => (
                      <div key={calc.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-600">
                            {calc.timestamp.toLocaleString("ar-YE")}
                            <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">ID: {calc.id}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>الأضلاع:</strong> {calc.side1}, {calc.side2}, {calc.hypotenuse}
                          </div>
                          <div>
                            <strong>المساحة:</strong> {calc.area_m2.toFixed(4)} م² = {calc.area_labnah.toFixed(6)} لبنة
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>عن التطبيق</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">وصف التطبيق</h3>
                  <p className="text-gray-700">
                    تطبيق حساب مساحة المثلثات (لبنة) هو أداة متخصصة لحساب مساحة المثلثات باستخدام قانون هيرون، مع
                    إمكانية التحويل إلى وحدة اللبنة اليمنية التقليدية. يستخدم التطبيق قاعدة بيانات SQLite لحفظ جميع
                    العمليات والنتائج.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ميزات قاعدة البيانات</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>حفظ جميع العمليات الحسابية في قاعدة بيانات SQLite</li>
                    <li>تتبع الجلسات المختلفة للمستخدمين</li>
                    <li>إحصائيات شاملة للاستخدام</li>
                    <li>إمكانية تصدير البيانات بصيغة JSON</li>
                    <li>سجل مفصل لجميع العمليات والأخطاء</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">كيفية الاستخدام</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>أدخل أطوال الأضلاع الثلاثة للمثلث</li>
                    <li>اضغط على زر "حساب" لحساب المساحة وحفظها في قاعدة البيانات</li>
                    <li>استخدم زر "أضف للإجمالي" لجمع المساحات</li>
                    <li>انسخ النتائج باستخدام أزرار النسخ</li>
                    <li>راجع السجل والإحصائيات في التبويبات المختلفة</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">معادلة التحويل</h3>
                  <p className="text-gray-700">1 لبنة = 44.4444 متر مربع</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">قانون هيرون</h3>
                  <p className="text-gray-700">
                    المساحة = √(s(s-a)(s-b)(s-c))
                    <br />
                    حيث s = (a+b+c)/2
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">تقنيات التطبيق</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Next.js 15 مع React 19</li>
                    <li>TypeScript للأمان في الكتابة</li>
                    <li>Tailwind CSS للتصميم</li>
                    <li>SQLite لقاعدة البيانات (محاكاة باستخدام localStorage)</li>
                    <li>shadcn/ui للمكونات</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-semibold text-lg">معلومات التواصل</h3>
              <p className="text-gray-700">م/ إبراهيم الرداعي</p>
              <p className="text-gray-700">الهاتف: 770633517</p>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <Facebook className="w-4 h-4" />
                فيسبوك
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <Instagram className="w-4 h-4" />
                إنستغرام
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <MessageCircle className="w-4 h-4" />
                تليغرام
              </Button>
            </div>

            <p className="text-sm text-gray-500">© 2024 حساب مساحة المثلثات (لبنة) - جميع الحقوق محفوظة</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
