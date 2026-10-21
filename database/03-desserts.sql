SET NAMES utf8mb4;

INSERT INTO recipes
(category_id, title, description, ingredients, instructions,
 cooking_minutes, servings)
SELECT c.id, s.title, s.description, s.ingredients, s.instructions,
       s.cooking_minutes, s.servings
FROM (
  SELECT
    'Chè đậu xanh' AS title,
    'Chè đậu xanh mềm thơm, dùng nóng hoặc lạnh.' AS description,
    '200 g đậu xanh đã cà vỏ\n100 g đường\n1 lít nước\nMột ít muối' AS ingredients,
    'Rửa sạch đậu xanh, ngâm khoảng 2 giờ rồi để ráo.\nCho đậu và nước vào nồi, đun sôi.\nHạ lửa, nấu đến khi đậu chín mềm.\nThêm đường và một ít muối, nấu thêm 5 phút.\nMúc ra bát và thưởng thức.' AS instructions,
    45 AS cooking_minutes,
    4 AS servings
  UNION ALL
  SELECT
    'Sữa chua trái cây',
    'Món tráng miệng từ sữa chua và trái cây tươi.',
    '2 hộp sữa chua\n1 quả chuối\n1 quả xoài chín\n100 g dâu tây',
    'Rửa sạch dâu tây, gọt vỏ xoài và chuối.\nCắt trái cây thành miếng vừa ăn.\nChia sữa chua vào hai bát, thêm trái cây.\nTrộn nhẹ và dùng ngay.',
    10,
    2
  UNION ALL
  SELECT
    'Chè khoai lang',
    'Chè khoai lang ngọt dịu, thơm nước cốt dừa.',
    '400 g khoai lang\n100 ml nước cốt dừa\n80 g đường\n800 ml nước\n20 g bột năng\nMột ít muối',
    'Gọt vỏ khoai, rửa sạch và cắt miếng vừa ăn.\nĐun khoai với nước đến khi chín mềm.\nThêm đường, nước cốt dừa và một ít muối.\nHòa bột năng với ít nước lạnh, rót từ từ vào nồi và khuấy nhẹ.\nĐun sôi trở lại đến khi bột chín, chè hơi sánh rồi tắt bếp.',
    30,
    4
) AS s
JOIN categories c ON c.name = 'Tráng miệng'
WHERE NOT EXISTS (
  SELECT 1 FROM recipes r WHERE r.title = s.title
);
