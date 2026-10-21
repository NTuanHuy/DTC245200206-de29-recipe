SET NAMES utf8mb4;

INSERT INTO recipes
(category_id, title, description, ingredients, instructions,
 cooking_minutes, servings)
SELECT c.id, s.title, s.description, s.ingredients, s.instructions,
       s.cooking_minutes, s.servings
FROM (
  SELECT
    'Món chính' AS category_name,
    'Thịt kho trứng' AS title,
    'Thịt heo kho mềm cùng trứng, thích hợp ăn với cơm.' AS description,
    '500 g thịt ba chỉ\n4 quả trứng\n2 thìa nước mắm\n1 thìa đường\n2 củ hành tím\n500 ml nước' AS ingredients,
    'Luộc chín trứng, bóc vỏ. Rửa sạch thịt và cắt miếng.\nƯớp thịt với nước mắm và hành băm trong 15 phút.\nĐun đường với ít nước đến màu vàng nâu, thêm thịt và đảo đều.\nThêm nước, đun sôi rồi hạ lửa kho khoảng 40 phút.\nCho trứng vào, kho thêm 15 phút đến khi thịt mềm, nêm lại vừa ăn.' AS instructions,
    70 AS cooking_minutes,
    4 AS servings
  UNION ALL
  SELECT
    'Món chính',
    'Cá sốt cà chua',
    'Cá chiên kết hợp sốt cà chua đậm đà.',
    '500 g cá rô phi đã làm sạch\n3 quả cà chua\n2 củ hành tím\n2 thìa dầu ăn\n1 thìa nước mắm\n100 ml nước',
    'Rửa cá, để ráo. Rửa cà chua và cắt nhỏ.\nChiên cá đến khi hai mặt vàng và thịt cá chín.\nPhi hành, thêm cà chua và đảo đến khi mềm.\nThêm nước và nước mắm, đun sốt khoảng 5 phút.\nCho cá vào sốt, đun nhỏ lửa thêm 5 phút rồi dùng nóng.',
    35,
    3
  UNION ALL
  SELECT
    'Món canh',
    'Canh rau ngót thịt băm',
    'Canh rau ngót thanh nhẹ với thịt heo băm.',
    '200 g rau ngót\n150 g thịt heo băm\n1 củ hành tím\n800 ml nước\n1 thìa dầu ăn\nMuối vừa đủ',
    'Nhặt rau ngót, rửa sạch rồi vò nhẹ.\nPhi hành với dầu, cho thịt vào đảo đến khi săn.\nThêm nước và đun sôi, hớt bọt.\nCho rau vào, nấu đến khi rau và thịt chín, nêm muối vừa ăn.',
    20,
    3
  UNION ALL
  SELECT
    'Món canh',
    'Canh cải nấu nấm',
    'Canh cải xanh và nấm tươi, dễ chế biến.',
    '250 g cải xanh\n150 g nấm bào ngư\n2 lát gừng\n800 ml nước\nMuối vừa đủ',
    'Rửa cải và cắt khúc. Làm sạch nấm, xé miếng vừa ăn.\nĐun sôi nước với gừng, cho nấm vào nấu khoảng 5 phút.\nThêm cải, nấu đến khi rau chín rồi nêm muối vừa ăn.',
    15,
    3
  UNION ALL
  SELECT
    'Món chay',
    'Nấm xào rau củ',
    'Nấm xào cùng cà rốt và bông cải giòn ngọt.',
    '200 g nấm bào ngư\n1 củ cà rốt\n200 g bông cải xanh\n2 thìa nước tương\n1 thìa dầu ăn\n2 tép tỏi',
    'Làm sạch nấm. Gọt cà rốt, rửa bông cải và cắt miếng vừa ăn.\nChần cà rốt và bông cải trong nước sôi khoảng 2 phút, vớt ra.\nPhi tỏi với dầu, cho nấm vào xào đến khi chín.\nThêm rau củ và nước tương, đảo đến khi rau chín vừa rồi tắt bếp.',
    20,
    3
  UNION ALL
  SELECT
    'Món chay',
    'Đậu phụ kho nấm',
    'Đậu phụ kho nấm hương với nước tương.',
    '3 bìa đậu phụ\n100 g nấm hương tươi\n2 thìa nước tương\n1 thìa cà phê đường\n150 ml nước\n1 thìa dầu ăn',
    'Cắt đậu phụ thành miếng. Làm sạch nấm và thái vừa ăn.\nChiên đậu phụ đến khi vàng nhẹ, vớt ra.\nCho nấm, nước, nước tương và đường vào nồi, đun sôi.\nThêm đậu phụ, kho nhỏ lửa khoảng 10 phút cho thấm rồi nêm lại.',
    25,
    3
) AS s
JOIN categories c ON c.name = s.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM recipes r WHERE r.title = s.title
);
