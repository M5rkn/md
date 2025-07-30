import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем тестовых пользователей
  console.log('👥 Создаем пользователей...');
  
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@medical-aggregator.ru' },
    update: {},
    create: {
      name: 'Администратор Системы',
      email: 'admin@medical-aggregator.ru',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@medical-aggregator.ru' },
    update: {},
    create: {
      name: 'Доктор Иванов',
      email: 'doctor@medical-aggregator.ru',
      password: userPassword,
      role: 'DOCTOR',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Тестовый Пользователь',
      email: 'user@example.com',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log(`✅ Создано пользователей: Admin(${admin.id}), Doctor(${doctor.id}), User(${testUser.id})`);

  // Создаем каталог БАДов
  console.log('💊 Создаем каталог БАДов...');

  const supplements = await Promise.all([
    prisma.supplement.upsert({
      where: { id: 'vitamin-d3-1000' },
      update: {},
      create: {
        id: 'vitamin-d3-1000',
        name: 'Витамин D3 1000 МЕ',
        price: 299.00,
        description: 'Поддерживает здоровье костей и иммунной системы. Рекомендуется при дефиците витамина D. Производитель: Now Foods. 120 капсул.',
        tags: ['витамин d', 'иммунитет', 'кости', 'now foods'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'omega-3-epa-dha' },
      update: {},
      create: {
        id: 'omega-3-epa-dha',
        name: 'Омега-3 EPA/DHA 1000 мг',
        price: 899.00,
        description: 'Полиненасыщенные жирные кислоты для здоровья сердца и мозга. Высокая концентрация EPA (300 мг) и DHA (200 мг). Очищенный рыбий жир.',
        tags: ['омега-3', 'сердце', 'мозг', 'epa', 'dha'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'magnesium-bisglycinate' },
      update: {},
      create: {
        id: 'magnesium-bisglycinate',
        name: 'Магний Бисглицинат 200 мг',
        price: 599.00,
        description: 'Хелатная форма магния с высокой биодоступностью. Поддерживает нервную систему, мышцы и качество сна. Не вызывает расстройства пищеварения.',
        tags: ['магний', 'нервы', 'мышцы', 'сон', 'стресс'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'probiotic-complex' },
      update: {},
      create: {
        id: 'probiotic-complex',
        name: 'Пробиотик Комплекс 50 млрд КОЕ',
        price: 1299.00,
        description: 'Комплекс полезных бактерий для здоровья кишечника. 10 штаммов лактобацилл и бифидобактерий. 50 миллиардов КОЕ на капсулу.',
        tags: ['пробиотик', 'пищеварение', 'кишечник', 'лактобациллы'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'coq10-ubiquinol' },
      update: {},
      create: {
        id: 'coq10-ubiquinol',
        name: 'Коэнзим Q10 Убихинол 100 мг',
        price: 1599.00,
        description: 'Мощный антиоксидант для энергии клеток и здоровья сердца. Активная убихинол форма с высокой биодоступностью.',
        tags: ['q10', 'энергия', 'антиоксидант', 'сердце', 'убихинол'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'vitamin-b-complex' },
      update: {},
      create: {
        id: 'vitamin-b-complex',
        name: 'Витамин B-Комплекс',
        price: 399.00,
        description: 'Полный комплекс витаминов группы B для энергии и нервной системы. Включает B1, B2, B6, B12, фолиевую кислоту и биотин.',
        tags: ['витамин b', 'энергия', 'нервы', 'метаболизм'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'zinc-picolinate' },
      update: {},
      create: {
        id: 'zinc-picolinate',
        name: 'Цинк Пиколинат 25 мг',
        price: 349.00,
        description: 'Высокоусвояемая форма цинка для иммунитета и здоровья кожи. Пиколинат цинка - одна из самых биодоступных форм.',
        tags: ['цинк', 'иммунитет', 'кожа', 'пиколинат'],
        inStock: true,
      },
    }),

    prisma.supplement.upsert({
      where: { id: 'ashwagandha-extract' },
      update: {},
      create: {
        id: 'ashwagandha-extract',
        name: 'Ашваганда Экстракт 500 мг',
        price: 799.00,
        description: 'Адаптогенное растение для снижения стресса и улучшения энергии. Стандартизированный экстракт с 5% витанолидами.',
        tags: ['ашваганда', 'стресс', 'адаптоген', 'энергия'],
        inStock: true,
      },
    }),
  ]);

  console.log(`✅ Создано БАДов: ${supplements.length}`);

  // Создаем тестовую анкету
  console.log('📋 Создаем тестовую анкету...');

  const testForm = await prisma.form.create({
    data: {
      userId: testUser.id,
      answers: {
        personalInfo: {
          age: 28,
          gender: 'female',
          weight: 65,
          height: 168,
          activityLevel: 'moderate',
        },
        medicalInfo: {
          chronicDiseases: ['гипотиреоз'],
          currentMedications: ['L-тироксин 75 мкг'],
          allergies: ['орехи', 'морепродукты'],
          pregnancyLactation: false,
        },
        symptoms: {
          energyLevel: 2,
          sleepQuality: 3,
          stressLevel: 4,
          digestiveIssues: ['вздутие', 'нерегулярный стул'],
          otherSymptoms: ['выпадение волос', 'сухость кожи'],
        },
        lifestyle: {
          diet: 'omnivore',
          smokingAlcohol: {
            smoking: false,
            alcohol: 'occasional',
          },
          supplementHistory: ['витамин D', 'железо'],
        },
        goals: {
          healthGoals: ['повысить энергию', 'улучшить пищеварение', 'укрепить волосы'],
          budgetRange: 'medium',
          deliveryPreference: 'курьер',
        },
      },
    },
  });

  console.log(`✅ Создана анкета: ${testForm.id}`);

  // Создаем рекомендации на основе анкеты
  console.log('🤖 Создаем ИИ-рекомендации...');

  const recommendations = await Promise.all([
    prisma.recommendation.create({
      data: {
        formId: testForm.id,
        name: 'Витамин D3 1000 МЕ',
        dose: '1 капсула утром во время еды',
        duration: '3 месяца',
        description: 'Рекомендуется для поддержки иммунитета и энергии, особенно при гипотиреозе',
        confidence: 0.92,
      },
    }),

    prisma.recommendation.create({
      data: {
        formId: testForm.id,
        name: 'Пробиотик Комплекс 50 млрд КОЕ',
        dose: '1 капсула утром натощак',
        duration: '2 месяца',
        description: 'Для улучшения пищеварения и решения проблем с ЖКТ',
        confidence: 0.87,
      },
    }),

    prisma.recommendation.create({
      data: {
        formId: testForm.id,
        name: 'Магний Бисглицинат 200 мг',
        dose: '1 капсула вечером за 30 мин до сна',
        duration: '1 месяц',
        description: 'Для снижения уровня стресса и улучшения качества сна',
        confidence: 0.84,
      },
    }),
  ]);

  console.log(`✅ Создано рекомендаций: ${recommendations.length}`);

  // Создаем тестовый заказ
  console.log('🛒 Создаем тестовый заказ...');

  const testOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      items: [
        {
          supplementId: 'vitamin-d3-1000',
          name: 'Витамин D3 1000 МЕ',
          price: 299.00,
          quantity: 2,
        },
        {
          supplementId: 'probiotic-complex',
          name: 'Пробиотик Комплекс 50 млрд КОЕ',
          price: 1299.00,
          quantity: 1,
        },
      ],
      totalPrice: 1897.00,
      deliveryInfo: {
        address: {
          city: 'Москва',
          street: 'ул. Тверская',
          building: '15',
          apartment: '45',
          postalCode: '125009',
        },
        phone: '+7 (999) 123-45-67',
        email: 'user@example.com',
        deliveryMethod: 'courier',
        comment: 'Доставить после 18:00',
      },
      status: 'CONFIRMED',
    },
  });

  console.log(`✅ Создан заказ: ${testOrder.id}`);

  // Создаем системные настройки
  console.log('⚙️ Создаем системные настройки...');

  const settings = [
    { key: 'app_name', value: 'Медицинский агрегатор' },
    { key: 'app_version', value: '1.0.0' },
    { key: 'ai_model_version', value: 'gpt-4-turbo' },
    { key: 'max_file_size', value: '10485760' }, // 10MB
    { key: 'allowed_file_types', value: 'pdf,jpg,jpeg,png,doc,docx' },
    { key: 'min_order_amount', value: '500' },
    { key: 'delivery_price_courier', value: '300' },
    { key: 'delivery_price_post', value: '200' },
    { key: 'support_email', value: 'support@medical-aggregator.ru' },
    { key: 'support_phone', value: '+7 (800) 555-01-23' },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }

  console.log(`✅ Создано настроек: ${settings.length}`);

  console.log('🎉 Заполнение базы данных завершено успешно!');
  console.log('\n📊 Итоговая статистика:');
  console.log(`👥 Пользователей: 3 (1 админ, 1 доктор, 1 пользователь)`);
  console.log(`💊 БАДов в каталоге: ${supplements.length}`);
  console.log(`📋 Анкет: 1`);
  console.log(`🤖 Рекомендаций: ${recommendations.length}`);
  console.log(`🛒 Заказов: 1`);
  console.log(`⚙️ Настроек: ${settings.length}`);
  console.log('\n🔑 Тестовые аккаунты:');
  console.log('   Админ: admin@medical-aggregator.ru / admin123');
  console.log('   Доктор: doctor@medical-aggregator.ru / user123');
  console.log('   Пользователь: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 