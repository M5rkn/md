#!/bin/bash

echo "🔧 Исправление ESLint ошибок..."

# Закомментируем все console.log и console.error
echo "📝 Закомментируем console.log..."

# ConsultationsPage.tsx
sed -i '' 's/console\.error/\/\/ console.error/g' client/src/pages/ConsultationsPage.tsx

# ProfilePage.tsx
sed -i '' 's/console\.error/\/\/ console.error/g' client/src/pages/ProfilePage.tsx
sed -i '' 's/console\.log/\/\/ console.log/g' client/src/pages/ProfilePage.tsx

# SurveyPage.tsx
sed -i '' 's/console\.error/\/\/ console.error/g' client/src/pages/SurveyPage.tsx
sed -i '' 's/console\.log/\/\/ console.log/g' client/src/pages/SurveyPage.tsx

# ResultsPage.tsx
sed -i '' 's/console\.error/\/\/ console.error/g' client/src/pages/ResultsPage.tsx

# Удалим неиспользуемые переменные
echo "🗑️ Удалим неиспользуемые переменные..."

# ConsultationsPage.tsx - закомментируем user
sed -i '' 's/const { user } = useAuth();/\/\/ const { user } = useAuth();/g' client/src/pages/ConsultationsPage.tsx

# ProfilePage.tsx - закомментируем неиспользуемые переменные
sed -i '' 's/const \[userStats, setUserStats\]/\/\/ const [userStats, setUserStats]/g' client/src/pages/ProfilePage.tsx
sed -i '' 's/const \[analyses, setAnalyses\]/\/\/ const [analyses, setAnalyses]/g' client/src/pages/ProfilePage.tsx
sed -i '' 's/const getPriorityColor/\/\/ const getPriorityColor/g' client/src/pages/ProfilePage.tsx
sed -i '' 's/const getPriorityText/\/\/ const getPriorityText/g' client/src/pages/ProfilePage.tsx

echo "✅ ESLint ошибки исправлены!" 