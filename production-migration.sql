-- SONSIEL Mentorship Hub - Production Database Migration Script
-- Generated for migrating mentors and mentees from development to production

-- =====================================================
-- STEP 1: MENTOR ACCOUNTS (11 users)
-- =====================================================
-- Note: Users have their existing password hashes preserved from development
-- must_change_password=false means they use their current passwords

INSERT INTO users (email, password, first_name, last_name, role, is_active, is_verified, is_profile_complete, must_change_password, timezone, preferred_language)
VALUES 
  ('bohyeeba26@gmail.com', 'ef0df1e03b3dd021b7354281e3b3d38dce2d7a19f61028274af10e7c5ff71979668c53ea975976d747e11bd4869d8f9feb85ff58375d69cbd167749428b12362.f3423084d78ec1d264a5385498f7ccfc', 'COMFORT', 'AMOAH', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('mlackerman2016@gmail.com', '3e66c90f8beac44787b9b5636c1835ad9f8b4afc33288da864f8835097e8d94107d1495932b52eafae5d8ab51e7731540be64d52433b2d7b6cd9fdef62f9b3ff.fd7236ccfd584487d51ee85f0860e633', 'Mary Lou', 'Ackerman', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('fesselek@mskcc.org', '6c4fb0797332d853ce3a2f86f76c6451105e37d323f02cb6a591d7e09e8d83ef4b23b278e6056c34ec6176696c4be9d0238028aaebb6a2169a8c661491c184c3.ef08b4b01c6c838fbef692276e564222', 'Kristen', 'Fessele', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('gulekb@uw.edu', 'fa678e1c618da0497bfc127c8c4efda82b70958297da5cf5ea768e4a11f9cb9800ecaecdc6973427ff368abf26b129b80ceaa10be570dc48405339a7b395dc9c.f76bf2a9d58acc8eb78f73344df7aca6', 'Bernice', 'Gulek', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('abby.v.hess@gmail.com', '427e1e53a8f998d943aebb19eb629c680dffe577fd18915f9da5fcc6a8780d2ef1be9e7b11e65aeddd4c102c4bff43c4a671603c80b11ed1119b973bbb923466.4c444ca18467c57dcd0650af09ae26a2', 'Abby', 'Hess', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('hnadel@mgh.harvard.edu', 'e6b9fc5065f5310aca07f5c155993eb636a75cf67363d4b0982c923d8f522e99381a7a8f41d27f925483bad75a2c351bf80efb4f96ad660477181b31a02bcbe5.92a4993524e2ace3baf66ea0cc3fb2ad', 'Hiyam', 'Nadel', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('leeticiarb@usp.br', '59010ce91c9da44658c3a2adddd5d7671b31eff7efb259eb184130ab90895c712b902a142036898fc61b8ef1ab5aa95673f7dbffa5f358c5af3c846ddd11144e.2a157027e24f56790e373e9c64c2cd4c', 'Letícia', 'Ribeiro', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('andressa.fernanda18@hotmail.com', '22c08a308743b776d39a8f81af9c37118e1f8df9c16edeca39415a35c1e219323e7d6297e05115218d3f2ca9c2142a168ddc2f99dc400e8abde7cfe17b4557b6.3e6c90998814450298bfa9ccc7069161', 'Andressa Fernanda', 'Silva Grigoletto', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('michael@skapahealth.com', 'b553962285d78931b8e5310187e3dcd7d13f69dfc23a5697e54a78b63fbe40e1bbf912aa2225ba480884afc5c23ae5e6dc91393401e53c89d159e800d7ee567e.cb334d145fdf73662e6b860f412cda75', 'Michael', 'Thorn', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('kwhalen3@mgb.org', '09e78aba456aca17fed998e5023e7aaabf04f665b8fa5af38394f9bd6088eabef2c538082841e84b0ac80e382cb830aec2a2bacb6a363422680de4c3676c5568.17a5130c8f74b00adb17af602da20f85', 'Kim', 'Whalen', 'MENTOR', true, false, false, false, 'America/New_York', 'en'),
  ('onikew@gmail.com', 'eb35b9f82190ded488cadcc9997756bf32d9c2193713a6d81bc1baeb4edbadab45d23231e992f72c628bc39414aeafcf9a53c34faba16aeaca646da590b93f5d.ef3dc8686d1ccc8c723fd28517eed351', 'Onike', 'Williams', 'MENTOR', true, false, false, false, 'America/New_York', 'en')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- STEP 2: MENTEE ACCOUNTS (19 users)
-- =====================================================

INSERT INTO users (email, password, first_name, last_name, role, is_active, is_verified, is_profile_complete, must_change_password, timezone, preferred_language)
VALUES 
  ('dr.tarteel.mustafa@gmail.com', '4a07b339a131cab66c254253d859a44e0f48b99c1e0db95eb80aeeccb28f2da5fb95e86b0d8d474ef8d9522e00156672333005d79cd682bde30f4bda56850621.36fa46fd83d1eb0be010c86f1bc4afc5', 'Tarteel', 'Abdelmajid', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('zainabadebayo00@gmail.com', '7d8e8f72fc7a8f543a02eb9d0f26f1da60e9ca6d587b7ac994c857f879a1887eab1881d49862b8ebbca07bad9ffc7726bc5f4700df188aa3d1d32f3ca43657f5.0d9b45c76d924447d5f913e86734cd8a', 'Zainab', 'Adebayo', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('thepurecoat@gmail.com', 'd1c90118d6f6b9719c1084f51babc08995e8a3af6e69dd73bd86a07d993f713c64d5b4f505c52bad0bcdfdbb55b2806e02f0c143241be966774d663f0985680f.3e2d93f040618e5bb2245770cc455ff8', 'Molore', 'Agunbiade', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('ffadanielle@gmail.com', 'a4f94e01ada78f7c7d0921e9e2d78732aa6278070e68b22eb2bba853ea1676911e16883a74d17e1ff313294837c98440fd2bdb6fbcfb2ef1d9d8d10b3ad061bb.0d40333ed156be4246bbddd3e4ffa7a9', 'Dani', 'Brochu', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('omconflenti3@gmail.com', '15dd37fc0b3199e2dfc3db4b572056d9299fdf6fee0fbc4ea430cc2de4029ea60046ebb48eca97df0cf6c19cd38ebca57cff12ec7caf59af858158a70e0c1602.e88733142b12fe47ee13df57fe8d3e5e', 'Ongelique', 'Conflenti', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('jeniffer.dolinta@childrens.com', '199fafa42f1c871945b1ab5b51cf8b4b40c7472d91fa0d6802b273e969bdac04e17c7809f6bea2ab7b9f27176684beb22afaefbce3970e256b4934517216dfc1.9bf2f9bcbe6e24caefacc099445f15a8', 'Jeniffer', 'Dolinta', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('joellefitzgerald001@gmail.com', '7d2fddbef160319c48ed8ccaed4bd306cd0edae1a86e3851036dba9f47867de7b31c7d739c0a3c13f0314234cc1cbc456f5201fc35d62f9afe4bbf8b09633281.6f4bf6a09b1d7e840240db39bf0d6e6e', 'Joelle', 'Fitzgerald', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('igrau931@gmail.com', '896a78bbb70273ca02bc05feb63e758ab5ad0cdbe93e826c0966bbb6451431cd917273f978e9ce834d661738ace0b885c09305b53651105bfc4429c84b6e5e9b.26a1eea805dc65304edf8ea16f1b96fa', 'Isabella', 'Grau', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('jacquelineidun@gmail.com', '2ff8e9064e7dfb407d9fbd08b89bb1eac918a778271c4cd5439fd6c7d966fa32f1708a6fd56dd7af43c78286b7c80f59b50bb6a21763b5a4fb12d17b2e768b87.4c8e6de1bb9321f6a8c4bd11fd132abf', 'Jacqueline', 'Idun', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('nursesforsustainablecare@gmail.com', 'eeb5cc7a9621fa2aa550426a854d2d8c8c60ca62a893bd5996f1423a6a4c0d9ab134d4da787487b3a73425dc106f4268263c5a487d7dbce5ffc9adc14f2dbd70.ef7dfd7b41f19c0334fee9dd655ad9df', 'Anne', 'Jordan', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('alexanderklotsche@gmail.com', '7135ea01b2044a811db750ce3594de1d29293db636fd3837895b9cd7a004a0c48c7cd954683e0fa2ce374b770c677e01368db422512d3236c83c41567938e848.045116d17f983e291888519480d6afc9', 'Alex', 'Klotsche', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('lindsey.macdonald@pennmedicine.upenn.edu', '66f312a760e5d92cc0e1fa72c79f7cca7c8d02bb3e4eced1e6298fac23c1bd1a631ebc4faa831a7e04598ec8c1506f044db962c7f61c79f2c0440ff980ec6040.a56ad96065cf344f306fae7b877c4593', 'Lindsey', 'MacDonald', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('sarahmcdonough9@gmail.com', '02dc5e282a0fd4e5b38eb136bac76334973b22b3291bab7988284cb7ee04f89332077b3e6f385754d308e24f4c16438959ff432696e123088ea52693b4331a43.9c573eb9c8054f74776e114b3c9c173a', 'Sarah', 'McDonough', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('angiecristina799@gmail.com', 'a635c834763a3e8a4b65c0c3736fab3a3ba5248509d8922713435f3c731821013c4c1932ac07826696a733157c01b50ffaf63a5392816291741cab5e9e1921df.f9ea2fb3ac15b4d150904dc01c11fe3d', 'Angie Cristina', 'Mendoza Quiñonez', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('selina.nazzaro@gmail.com', '215925828cc09df7b2cfd65be5b8dcfcad4174d8f3247a3c33ec2cf1048525d3998af87a77388675de0ad209bdd3895c22e32dc12d71bec05fa7da60b86f32e0.309bf1782d01b564c5e39375f02bfd0f', 'Selina', 'Nazzaro', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('emilyspontes@hotmail.com', '65406c7ca1e4edde457be4f6ffb51f502ed0f99adbf7fa501b069166a62dcbedf3aecf0b0919aa745dbf6bf7759ef7e1396782b464be3656267ef9a9517fe641.65584f5dfb914153cd58f6f5e89c4c29', 'Emily', 'Pontes', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('c_mclean86@yahoo.com', 'bc7581041d2a17597f8450c56bedcb725861dbd4c3a9087a5bb8752aa1c75f835e83ada860b26bb83c875cf80ddc41000cf68d3fc03bffe39ffbbf5d6403665d.977a9a769fbe178fcac677f805372014', 'CHRISTINE', 'RINCON', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('reedbe712@gmail.com', '4a10ee363f097e8daac5bd3b0fc947b3e2b3b2f59bae7010c7d37fe57a643e27f3b1ebeeb2a4d837ee159dfd01dadc0a92042f0040bb1f6bde77fb9393a31201.7e23d6d63260abc082269716438886a2', 'Brianna', 'Reed', 'MENTEE', true, false, false, false, 'America/New_York', 'en'),
  ('elena@vesnamedicalstaffing.com', 'bcd44644f236cf9dc88848c3df3db5a1432da4faabb5e3057d02fc75534fc10f110177cbf895bc31dae13be0d1f2a77c0bc95a1751a55af115dc87ba2f1fb2d4.0f38151ad5a12a8161967c7cc341c142', 'Elena', 'Yakubov', 'MENTEE', true, false, false, false, 'America/New_York', 'en')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- STEP 3A: SYSTEM FOLDER (Required for documents)
-- =====================================================
-- Create the system folder for public resources

INSERT INTO folders (id, name, scope, is_system_folder, parent_id, created_at, updated_at)
VALUES 
  ('4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'System Resources', 'SYSTEM', true, NULL, '2026-01-05 19:15:00.000000', '2026-01-05 19:15:00.000000')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3B: DOCUMENTS (5 Track Guides)
-- =====================================================
-- Note: These documents are stored in Replit Object Storage
-- The file URLs point to the shared object storage, accessible in production
-- Documents are assigned to the system folder for visibility

INSERT INTO documents (id, name, description, file_url, file_type, mime_type, file_size, visibility, folder_id, category, created_at)
VALUES 
  ('121e3325-9976-4011-a873-1a3164af53bb', 'Leader Track - Guide', 'Track guide for Leaders', '/objects/uploads/8576c847-41b2-4622-b13a-0ab1bf5405ab', NULL, 'application/pdf', 290097, 'PUBLIC', '4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'RESOURCE', '2026-01-05 19:16:32.364118'),
  ('893c2d10-a8d0-498b-bc38-65d927ba9b93', 'Innovator Track - Guide', 'Track guide for Innovators', '/objects/uploads/6d932166-dd0e-466c-8778-d9e687416cff', NULL, 'application/pdf', 285898, 'PUBLIC', '4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'RESOURCE', '2026-01-05 19:16:52.590899'),
  ('8e6e9a97-9c8b-48c3-94fc-7668d55f4d13', 'Intrapreneur Track - Guide', 'Track guide for Intrapreneurs', '/objects/uploads/ae9f69bf-d405-47be-a27a-07333a64d496', NULL, 'application/pdf', 278451, 'PUBLIC', '4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'RESOURCE', '2026-01-05 19:17:16.448554'),
  ('0186825c-4d76-4938-8649-86753d8844bb', 'Entrepreneur Track - Guide', 'Track guide for Entrepreneurs', '/objects/uploads/7a3d5914-698b-4ec4-a529-f181b1b58bb6', NULL, 'application/pdf', 282058, 'PUBLIC', '4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'RESOURCE', '2026-01-05 19:17:38.603069'),
  ('fb250072-2f4d-475b-a976-aa342b0eb0bd', 'Scientist Track - Guide', 'Track guide for Scientists', '/objects/uploads/4a46b6ff-4c7f-4f77-a176-70c7f24d87a7', NULL, 'application/pdf', 289608, 'PUBLIC', '4bedbfdd-1c12-44ef-b368-cd9e5f8c750f', 'RESOURCE', '2026-01-05 19:18:13.745388')
ON CONFLICT (id) DO UPDATE SET folder_id = EXCLUDED.folder_id, category = EXCLUDED.category;

-- =====================================================
-- STEP 4: MENTOR COMMUNITY CATEGORIES (9 categories)
-- =====================================================
-- These are required for the mentor discussion board dropdown

INSERT INTO thread_categories (id, name, slug, description, color, icon, sort_order, is_active)
VALUES 
  ('35cacde0-02c2-4dc1-80b6-3c92fddf3531', 'Best Practices', 'best-practices', 'Share and discuss best practices in healthcare mentorship', '#0D9488', 'lightbulb', 1, true),
  ('ee81b80c-5316-4cae-9bbc-982a47cbf368', 'Questions', 'questions', 'Ask questions and get answers from the community', '#3B82F6', 'help-circle', 2, true),
  ('86c77c71-d0f3-47e2-adad-e70f275b730a', 'Resources', 'resources', 'Share useful resources, articles, and tools', '#8B5CF6', 'book-open', 3, true),
  ('f3243307-6754-4745-87b4-0e78f8356e98', 'Track: Scientist', 'track-scientist', 'Discussions specific to the Scientist track', '#10B981', 'flask-conical', 4, true),
  ('19d4ca03-acb9-4f95-a06b-6c3cf24a8eb3', 'Track: Innovator', 'track-innovator', 'Discussions specific to the Innovator track', '#F59E0B', 'sparkles', 5, true),
  ('018b9588-ec6f-4d14-96f4-563e0af7e778', 'Track: Entrepreneur', 'track-entrepreneur', 'Discussions specific to the Entrepreneur track', '#EF4444', 'rocket', 6, true),
  ('20942208-49ef-43fa-a9ed-84819cbe9402', 'Track: Intrapreneur', 'track-intrapreneur', 'Discussions specific to the Intrapreneur track', '#6366F1', 'building', 7, true),
  ('b5453787-67ff-42d5-89d2-a36fc2e7c92d', 'Track: Leader', 'track-leader', 'Discussions specific to the Leader track', '#EC4899', 'crown', 8, true),
  ('9721dafb-f3dc-479d-bea5-b197845cb9af', 'General Discussion', 'general', 'General conversations and community building', '#6B7280', 'message-square', 9, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: MENTEE COMMUNITY CATEGORIES (11 categories)
-- =====================================================
-- These are required for the mentee discussion board dropdown

INSERT INTO mentee_thread_categories (id, name, slug, description, color, icon, sort_order, is_active)
VALUES 
  ('c8a3bc8a-a829-4eab-885b-3ba03c669ec4', 'Introductions', 'introductions', 'Introduce yourself to fellow mentees', '#6366F1', 'UserPlus', 1, true),
  ('55a4aa76-85a6-476e-b9b6-ae4acd2c42d9', 'Goal Setting & SMART Goals', 'goal-setting', 'Discuss goal setting strategies and SMART goals', '#8B5CF6', 'Target', 2, true),
  ('4b7709c7-d717-4f88-8883-3644945f1d6b', 'Scientist Track', 'scientist-track', 'Discussions for mentees on the Scientist track', '#10B981', 'Microscope', 3, true),
  ('43372a93-14ed-491a-ae1e-aeba42866792', 'Innovator Track', 'innovator-track', 'Discussions for mentees on the Innovator track', '#F59E0B', 'Lightbulb', 4, true),
  ('7b6b0d5d-e847-4b0f-8024-f1a3685a0251', 'Entrepreneur Track', 'entrepreneur-track', 'Discussions for mentees on the Entrepreneur track', '#EF4444', 'Rocket', 5, true),
  ('ae813ca8-fb93-4707-a9f1-a3ad13d30797', 'Intrapreneur Track', 'intrapreneur-track', 'Discussions for mentees on the Intrapreneur track', '#3B82F6', 'Building', 6, true),
  ('9486daec-810d-4315-b797-65209521f526', 'Leader Track', 'leader-track', 'Discussions for mentees on the Leader track', '#EC4899', 'Crown', 7, true),
  ('8ca032af-5479-491c-aa0b-d6921d9072f2', 'Career Questions', 'career-questions', 'Ask and answer career-related questions', '#14B8A6', 'Briefcase', 8, true),
  ('1b3664fb-1af0-4362-9017-09a25c0891ef', 'Resources & Recommendations', 'resources', 'Share helpful resources and recommendations', '#0EA5E9', 'BookOpen', 9, true),
  ('3eb17079-1d19-4925-8ed0-5c63b6dea219', 'Wins & Celebrations', 'wins-celebrations', 'Celebrate your achievements and milestones', '#F97316', 'Trophy', 10, true),
  ('b5be06e6-0891-4713-a5c1-03a1d72008b3', 'General Discussion', 'general', 'General discussions and off-topic conversations', '#6B7280', 'MessageCircle', 11, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total Mentors: 11
-- Total Mentees: 19
-- Total Users: 30
-- Total Documents: 5 (Track Guides)
-- Total Mentor Categories: 9
-- Total Mentee Categories: 11
--
-- IMPORTANT NOTES:
-- 1. Users have their existing password hashes preserved from development
--    They can log in with the same passwords they used in development
-- 2. ON CONFLICT DO NOTHING - skips records that already exist
-- 3. Run this in your production database via the Replit Database panel
--    (Database > Production > My Data > SQL)
-- 4. Documents reference files in Object Storage - the files are shared
--    between development and production, so they will work automatically
-- 5. Documents do not have uploaded_by_id set (optional field) since
--    the original uploader's user ID may differ between environments
-- 6. Categories are needed for the discussion board dropdowns
--
-- HOW TO RUN:
-- 1. Go to Database in Replit
-- 2. Click "Production" tab
-- 3. Click "My Data"
-- 4. Click "SQL" or use the SQL query interface
-- 5. Paste and run this entire script
