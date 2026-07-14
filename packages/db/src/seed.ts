import 'dotenv/config';
import { createDB } from './index.js';
import * as s from './schema/index.js';
import { sql } from 'drizzle-orm';

const db = createDB(process.env.DATABASE_URL || 'postgres://kraftplan:kraftplan@localhost:5432/kraftplan');

async function seed() {
  console.log('🌱 Seeding KraftPlan database...');

  // Clear existing data
  await db.execute(sql`TRUNCATE block_exercises, plan_blocks, plan_days, plan_weeks, user_plan_assignments, workout_sets, workout_sessions, personal_records, event_outbox, exercise_alternatives, plans, exercises CASCADE`);
  console.log('🧹 Cleared existing data');

  // ─── EXERCISES ───
  const exercises = await db
    .insert(s.exercises)
    .values([
      // Chest
      { name: 'Barbell Bench Press', category: 'resistance', primaryMuscles: ['chest', 'triceps', 'front delts'], secondaryMuscles: [], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Lie on bench, feet flat', 'Grip bar slightly wider than shoulder width', 'Unrack and lower to mid-chest', 'Press up to lockout'], cues: ['Retract scapula', 'Elbows at 45°', 'Drive through heels'], mistakes: ['Bouncing off chest', 'Flaring elbows'] },
      { name: 'Dumbbell Bench Press', category: 'resistance', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front delts'], equipment: ['dumbbells', 'bench'], difficulty: 'intermediate', instructions: ['Lie on bench holding dumbbells at chest', 'Press up until arms extended', 'Lower with control'], cues: ['Neutral grip option', 'Control descent'], mistakes: ['Uneven press'] },
      { name: 'Incline Barbell Bench Press', category: 'resistance', primaryMuscles: ['upper chest', 'front delts', 'triceps'], secondaryMuscles: [], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Set bench to 30-45°', 'Press bar from upper chest', 'Lower to clavicle level'], cues: ['Keep shoulders down', '30° angle is ideal'], mistakes: ['Bench too steep'] },
      { name: 'Incline Dumbbell Press', category: 'resistance', primaryMuscles: ['upper chest', 'front delts'], secondaryMuscles: ['triceps'], equipment: ['dumbbells', 'bench'], difficulty: 'intermediate', instructions: ['Lie on incline bench with dumbbells', 'Press up and together slightly', 'Lower to chest width'], cues: ['Slight arc path'], mistakes: ['Going too heavy'] },
      { name: 'Decline Bench Press', category: 'resistance', primaryMuscles: ['lower chest', 'triceps'], secondaryMuscles: ['front delts'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Lie on decline bench', 'Press bar from lower chest', 'Lock out at top'], cues: ['Anchor feet'], mistakes: ['Overarching back'] },
      { name: 'Dumbbell Fly', category: 'resistance', primaryMuscles: ['chest'], secondaryMuscles: ['front delts'], equipment: ['dumbbells', 'bench'], difficulty: 'intermediate', instructions: ['Lie on bench with dumbbells extended above chest', 'Open arms wide with slight bend in elbows', 'Squeeze back up'], cues: ['Mild elbow bend', 'Hug the barrel at top'], mistakes: ['Too much weight', 'Straight arms'] },
      { name: 'Cable Crossover', category: 'resistance', primaryMuscles: ['chest'], secondaryMuscles: ['front delts'], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Set pulleys high', 'Step forward, lean slightly', 'Pull handles down and across to meet in front'], cues: ['Lean forward from hips', 'Squeeze at bottom'], mistakes: ['Leaning too far'] },
      { name: 'Push-Up', category: 'bodyweight', primaryMuscles: ['chest', 'triceps', 'front delts'], secondaryMuscles: ['core'], equipment: ['none'], difficulty: 'beginner', instructions: ['Start in plank with hands shoulder-width', 'Lower chest to floor', 'Press back up'], cues: ['Body in straight line', 'Elbows 45°'], mistakes: ['Sagging hips', 'Flaring elbows'] },
      { name: 'Diamond Push-Up', category: 'bodyweight', primaryMuscles: ['triceps', 'chest'], secondaryMuscles: ['front delts', 'core'], equipment: ['none'], difficulty: 'intermediate', instructions: ['Hands together forming diamond under chest', 'Lower until chest touches hands', 'Press up'], cues: ['Keep elbows tucked'], mistakes: ['Hands too far forward'] },
      { name: 'Decline Push-Up', category: 'bodyweight', primaryMuscles: ['upper chest', 'front delts'], secondaryMuscles: ['triceps', 'core'], equipment: ['bench'], difficulty: 'intermediate', instructions: ['Feet on bench, hands on floor', 'Lower chest to floor', 'Press back up'], cues: ['More weight on hands'], mistakes: ['Arching back'] },
      // Back
      { name: 'Barbell Deadlift', category: 'resistance', primaryMuscles: ['hamstrings', 'glutes', 'lower back', 'traps'], secondaryMuscles: ['core', 'forearms'], equipment: ['barbell'], difficulty: 'advanced', instructions: ['Stand with feet under bar', 'Hinge at hips and grip bar', 'Drive through heels to stand', 'Lower with control'], cues: ['Bar over mid-foot', 'Straight back', 'Drive hips forward'], mistakes: ['Rounding lower back', 'Jerking the weight'] },
      { name: 'Pull-Up', category: 'bodyweight', primaryMuscles: ['lats', 'biceps', 'upper back'], secondaryMuscles: ['core'], equipment: ['pull-up-bar'], difficulty: 'intermediate', instructions: ['Grip bar wider than shoulders', 'Hang with arms extended', 'Pull chin over bar', 'Lower under control'], cues: ['Pull from lats', 'Chest to bar'], mistakes: ['Kipping wildly', 'Not full range'] },
      { name: 'Lat Pulldown', category: 'resistance', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['upper back'], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Sit at pulldown station, knees anchored', 'Grip bar wide', 'Pull bar to upper chest', 'Slowly release'], cues: ['Lean back slightly', 'Drive elbows down'], mistakes: ['Pulling behind neck'] },
      { name: 'Barbell Row', category: 'resistance', primaryMuscles: ['upper back', 'lats', 'biceps'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['barbell'], difficulty: 'intermediate', instructions: ['Hinge at hips with flat back', 'Grip bar shoulder width', 'Pull bar to lower ribs', 'Lower with control'], cues: ['Back at 45°', 'Pull from elbows'], mistakes: ['Standing up too much', 'Using momentum'] },
      { name: 'Seated Cable Row', category: 'resistance', primaryMuscles: ['upper back', 'lats', 'biceps'], secondaryMuscles: ['core', 'rear delts'], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Sit with feet braced', 'Grip handle, arms extended', 'Pull handle to stomach', 'Slowly release'], cues: ['Squeeze shoulder blades', 'Chest out'], mistakes: ['Rocking body'] },
      { name: 'Dumbbell Row', category: 'resistance', primaryMuscles: ['lats', 'upper back', 'biceps'], secondaryMuscles: ['core', 'hamstrings'], equipment: ['dumbbells', 'bench'], difficulty: 'beginner', instructions: ['Place knee and hand on bench', 'Other hand holds dumbbell', 'Pull dumbbell to hip', 'Lower'], cues: ['Squeeze at top', 'Hinge at hip'], mistakes: ['Rotating torso'] },
      { name: 'T-Bar Row', category: 'resistance', primaryMuscles: ['upper back', 'lats', 'rear delts'], secondaryMuscles: ['biceps'], equipment: ['barbell'], difficulty: 'intermediate', instructions: ['Straddle bar with T-bar handle', 'Hinge at hips', 'Pull to chest', 'Lower'], cues: ['Chest up', 'Elbows back'], mistakes: ['Rounding back'] },
      { name: 'Face Pull', category: 'resistance', primaryMuscles: ['rear delts', 'upper back'], secondaryMuscles: ['rotator cuff'], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Set pulley at upper chest height', 'Grip with both hands', 'Pull toward face, elbows high', 'Slow release'], cues: ['External rotate at end', 'Elbows above wrists'], mistakes: ['Using too much weight'] },
      { name: 'Dead Hang', category: 'mobility', primaryMuscles: ['lats', 'forearms'], secondaryMuscles: ['shoulders'], equipment: ['pull-up-bar'], difficulty: 'beginner', instructions: ['Grip bar and hang fully extended', 'Relax shoulders', 'Hold for time'], cues: ['Active vs passive hang', 'Breathe'], mistakes: ['Bending arms'] },
      // Shoulders
      { name: 'Overhead Press (OHP)', category: 'resistance', primaryMuscles: ['front delts', 'triceps', 'upper chest'], secondaryMuscles: ['core', 'traps'], equipment: ['barbell'], difficulty: 'intermediate', instructions: ['Stand with bar on front shoulders', 'Press overhead to lockout', 'Lower to shoulders'], cues: ['Brace core', 'Press slightly behind ears'], mistakes: ['Arching back excessively'] },
      { name: 'Dumbbell Shoulder Press', category: 'resistance', primaryMuscles: ['front delts', 'side delts', 'triceps'], secondaryMuscles: [], equipment: ['dumbbells'], difficulty: 'intermediate', instructions: ['Sit or stand with dumbbells at shoulders', 'Press up until arms extended', 'Lower with control'], cues: ['Neutral grip option', 'Stop at ear level'], mistakes: ['Flaring low back'] },
      { name: 'Lateral Raise', category: 'resistance', primaryMuscles: ['side delts'], secondaryMuscles: ['traps'], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Stand with dumbbells at sides', 'Raise arms out to sides to shoulder height', 'Lower slowly'], cues: ['Slight bend in elbows', 'Lead with elbows'], mistakes: ['Shrugging up', 'Using momentum'] },
      { name: 'Front Raise', category: 'resistance', primaryMuscles: ['front delts'], secondaryMuscles: ['upper chest'], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Hold dumbbells in front of thighs', 'Raise arms forward to shoulder height', 'Lower with control'], cues: ['Palms down', 'Stop at shoulder level'], mistakes: ['Swinging body'] },
      { name: 'Bent-Over Lateral Raise', category: 'resistance', primaryMuscles: ['rear delts'], secondaryMuscles: ['upper back'], equipment: ['dumbbells'], difficulty: 'intermediate', instructions: ['Hinge at hips with flat back', 'Arms hanging below chest', 'Raise arms out and back'], cues: ['Thumb-down rotation', 'Squeeze rear delts'], mistakes: ['Too much weight'] },
      { name: 'Arnold Press', category: 'resistance', primaryMuscles: ['front delts', 'side delts', 'triceps'], secondaryMuscles: ['upper back'], equipment: ['dumbbells'], difficulty: 'intermediate', instructions: ['Start with dumbbells in front of shoulders, palms facing you', 'Press while rotating palms forward', 'Reverse on the way down'], cues: ['Rotate smoothly', 'Control the descent'], mistakes: ['Rotating too early'] },
      { name: 'Upright Row', category: 'resistance', primaryMuscles: ['traps', 'side delts'], secondaryMuscles: ['biceps'], equipment: ['barbell', 'dumbbells'], difficulty: 'beginner', instructions: ['Hold bar/dumbbells in front of thighs', 'Pull up along body to chin', 'Lower'], cues: ['Lead with elbows', 'Bar close to body'], mistakes: ['Going too heavy', 'Wrist pain'] },
      { name: 'Shrug', category: 'resistance', primaryMuscles: ['traps'], secondaryMuscles: ['shoulders'], equipment: ['dumbbells', 'barbell'], difficulty: 'beginner', instructions: ['Stand holding weight at sides', 'Shrug shoulders straight up', 'Hold at top, lower'], cues: ['Don\'t roll — straight up'], mistakes: ['Rolling shoulders'] },
      // Arms — Biceps
      { name: 'Barbell Curl', category: 'resistance', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['barbell'], difficulty: 'beginner', instructions: ['Stand holding barbell with underhand grip', 'Curl bar to shoulders', 'Lower under control'], cues: ['Elbows pinned to sides', 'Squeeze at top'], mistakes: ['Swinging', 'Elbows drifting forward'] },
      { name: 'Dumbbell Curl', category: 'resistance', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Stand with dumbbells at sides, palms forward', 'Curl one or both to shoulders', 'Lower'], cues: ['Supinate at top', 'Control negative'], mistakes: ['Using shoulders'] },
      { name: 'Hammer Curl', category: 'resistance', primaryMuscles: ['biceps', 'brachialis'], secondaryMuscles: ['forearms'], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Dumbbells at sides with neutral grip (palms facing)', 'Curl to shoulders keeping palms facing', 'Lower'], cues: ['Thumb up throughout'], mistakes: ['Supinating wrists'] },
      { name: 'Preacher Curl', category: 'resistance', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Sit at preacher bench with arms on pad', 'Curl bar toward shoulders', 'Lower fully'], cues: ['Don\'t lock out at bottom', 'Focus on stretch'], mistakes: ['Partial reps'] },
      { name: 'Cable Bicep Curl', category: 'resistance', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Set cable to low position', 'Grip handle and curl to shoulder', 'Slow release'], cues: ['Constant tension'], mistakes: ['Leaning back'] },
      { name: 'Concentration Curl', category: 'resistance', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Sit on bench, legs apart', 'Brace elbow against inner thigh', 'Curl dumbbell to shoulder'], cues: ['Full supination', 'Squeeze peak contraction'], mistakes: ['Swinging body'] },
      // Arms — Triceps
      { name: 'Close-Grip Bench Press', category: 'resistance', primaryMuscles: ['triceps', 'chest'], secondaryMuscles: ['front delts'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Lie on bench, hands shoulder-width on bar', 'Lower bar to lower chest', 'Press up'], cues: ['Elbows tucked', 'Hands inside shoulders'], mistakes: ['Grip too narrow'] },
      { name: 'Tricep Pushdown', category: 'resistance', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['cable-machine'], difficulty: 'beginner', instructions: ['Set cable to high position with straight bar', 'Elbows at 90°, push down to lockout', 'Slow release'], cues: ['Elbows pinned to sides', 'Only forearm moves'], mistakes: ['Elbows moving'] },
      { name: 'Overhead Tricep Extension', category: 'resistance', primaryMuscles: ['triceps (long head)'], secondaryMuscles: [], equipment: ['dumbbells', 'cable-machine'], difficulty: 'intermediate', instructions: ['Hold dumbbell overhead with both hands', 'Lower behind head by bending elbows', 'Extend back up'], cues: ['Elbows pointing forward', 'Full stretch at bottom'], mistakes: ['Flaring elbows'] },
      { name: 'Skull Crusher', category: 'resistance', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['barbell', 'dumbbells', 'bench'], difficulty: 'intermediate', instructions: ['Lie on bench holding bar over chest', 'Lower bar toward forehead by bending elbows', 'Extend back up'], cues: ['Elbows vertical', 'Stop at forehead'], mistakes: ['Lowering too far'] },
      { name: 'Tricep Kickback', category: 'resistance', primaryMuscles: ['triceps'], secondaryMuscles: ['core'], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Hinge at hips with flat back', 'Elbows at 90°', 'Extend arms straight back'], cues: ['Keep upper arm still', 'Hold contraction'], mistakes: ['Using momentum'] },
      // Legs — Quad dominant
      { name: 'Barbell Back Squat', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'hamstrings'], secondaryMuscles: ['core', 'lower back'], equipment: ['barbell', 'squat-rack'], difficulty: 'intermediate', instructions: ['Bar on upper back, feet shoulder-width', 'Sit back and down to parallel', 'Drive up through heels'], cues: ['Break at hips and knees', 'Chest up', 'Knees out'], mistakes: ['Butt wink', 'Knees caving'] },
      { name: 'Front Squat', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'upper back'], secondaryMuscles: ['core'], equipment: ['barbell', 'squat-rack'], difficulty: 'advanced', instructions: ['Bar on front shoulders, clean grip', 'Sit straight down keeping torso upright', 'Stand back up'], cues: ['Elbows high', 'Chest up'], mistakes: ['Dropping elbows', 'Leaning forward'] },
      { name: 'Leg Press', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'hamstrings'], secondaryMuscles: [], equipment: ['cardio-machine'], difficulty: 'beginner', instructions: ['Sit on leg press machine', 'Lower platform to 90° knee bend', 'Press through whole foot'], cues: ['Don\'t lock knees', 'Controlled descent'], mistakes: ['Locking out', 'Butt lifting'] },
      { name: 'Bulgarian Split Squat', category: 'resistance', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['dumbbells', 'bench'], difficulty: 'intermediate', instructions: ['Rear foot on bench, front foot forward', 'Lower back knee toward floor', 'Drive up through front heel'], cues: ['Torso upright', 'Front knee over ankle'], mistakes: ['Leaning too far forward'] },
      { name: 'Goblet Squat', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'core'], secondaryMuscles: ['hamstrings'], equipment: ['dumbbells', 'kettlebell'], difficulty: 'beginner', instructions: ['Hold weight at chest', 'Squat down to parallel or deeper', 'Stand back up'], cues: ['Elbows between knees at bottom', 'Heels down'], mistakes: ['Heels coming up'] },
      { name: 'Walking Lunge', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'hamstrings'], secondaryMuscles: ['core'], equipment: ['dumbbells'], difficulty: 'intermediate', instructions: ['Step forward into lunge', 'Back knee hovers', 'Drive forward into next step'], cues: ['Front knee 90°', 'Upright torso'], mistakes: ['Short stride'] },
      // Legs — Posterior chain
      { name: 'Romanian Deadlift (RDL)', category: 'resistance', primaryMuscles: ['hamstrings', 'glutes', 'lower back'], secondaryMuscles: ['core', 'forearms'], equipment: ['barbell', 'dumbbells'], difficulty: 'intermediate', instructions: ['Hold bar at hip height', 'Hinge back, slide bar down legs', 'Squeeze glutes to return'], cues: ['Soft knees', 'Bar stays close', 'Feel the stretch'], mistakes: ['Rounding back', 'Bending knees too much'] },
      { name: 'Leg Curl', category: 'resistance', primaryMuscles: ['hamstrings'], secondaryMuscles: [], equipment: ['cardio-machine'], difficulty: 'beginner', instructions: ['Lie face down on leg curl machine', 'Curl heels toward glutes', 'Lower under control'], cues: ['Don\'t let hips lift', 'Full range'], mistakes: ['Jerking weight'] },
      { name: 'Hip Thrust', category: 'resistance', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['core'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', instructions: ['Upper back on bench, bar across hips', 'Drive hips up squeezing glutes', 'Lower with control'], cues: ['Chin down', 'Full hip extension'], mistakes: ['Overextending lower back'] },
      { name: 'Glute Bridge', category: 'bodyweight', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['core'], equipment: ['mat'], difficulty: 'beginner', instructions: ['Lie on back, knees bent, feet flat', 'Drive hips up squeezing glutes', 'Lower'], cues: ['Pause at top', 'Don\'t overextend'], mistakes: ['Not getting full hip extension'] },
      { name: 'Cable Pull-Through', category: 'resistance', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['core'], equipment: ['cable-machine'], difficulty: 'intermediate', instructions: ['Set cable low, face away', 'Hinge at hips holding rope between legs', 'Thrust hips forward'], cues: ['Hinge not squat'], mistakes: ['Bending knees too much'] },
      // Calves
      { name: 'Standing Calf Raise', category: 'resistance', primaryMuscles: ['calves (gastrocnemius)'], secondaryMuscles: [], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Stand on edge of step or platform', 'Lower heels below step', 'Push up onto toes'], cues: ['Full range at bottom', 'Hold at top'], mistakes: ['Partial reps'] },
      { name: 'Seated Calf Raise', category: 'resistance', primaryMuscles: ['calves (soleus)'], secondaryMuscles: [], equipment: ['dumbbells'], difficulty: 'beginner', instructions: ['Sit with weight on knees', 'Raise heels up', 'Lower slowly'], cues: ['Deep stretch at bottom'], mistakes: ['Too fast'] },
      // Core
      { name: 'Plank', category: 'bodyweight', primaryMuscles: ['core', 'shoulders'], secondaryMuscles: [], equipment: ['mat'], difficulty: 'beginner', instructions: ['Forearms and toes on floor', 'Body in straight line', 'Hold for time'], cues: ['Squeeze glutes', 'Brace abs', 'Flat back'], mistakes: ['Sagging hips', 'Holding breath'] },
      { name: 'Side Plank', category: 'bodyweight', primaryMuscles: ['obliques', 'shoulders'], secondaryMuscles: ['core'], equipment: ['mat'], difficulty: 'beginner', instructions: ['Lie on side, forearm on floor', 'Lift hips forming straight line', 'Hold for time'], cues: ['Hips stacked', 'Shoulder over elbow'], mistakes: ['Hips dropping'] },
      { name: 'Cable Woodchop', category: 'resistance', primaryMuscles: ['obliques', 'core'], secondaryMuscles: ['shoulders'], equipment: ['cable-machine'], difficulty: 'intermediate', instructions: ['Set cable at shoulder height', 'Stand sideways, pull diagonally across body', 'Rotate torso, not arms'], cues: ['Rotate from core', 'Pause at end'], mistakes: ['Pulling with arms only'] },
      { name: 'Dead Bug', category: 'bodyweight', primaryMuscles: ['core', 'hip flexors'], secondaryMuscles: [], equipment: ['mat'], difficulty: 'beginner', instructions: ['Lie on back, arms up, legs at 90°', 'Extend opposite arm and leg', 'Return to center'], cues: ['Lower back flat on floor', 'Slow controlled movement'], mistakes: ['Arching back'] },
      { name: 'Hanging Leg Raise', category: 'bodyweight', primaryMuscles: ['lower abs', 'hip flexors'], secondaryMuscles: ['core', 'forearms'], equipment: ['pull-up-bar'], difficulty: 'advanced', instructions: ['Hang from bar', 'Raise legs to 90° or above', 'Lower slowly'], cues: ['Control any swing', 'Point toes'], mistakes: ['Swinging momentum'] },
      { name: 'Russian Twist', category: 'bodyweight', primaryMuscles: ['obliques', 'core'], secondaryMuscles: ['hip flexors'], equipment: ['mat'], difficulty: 'intermediate', instructions: ['Sit with knees bent, lean back slightly', 'Rotate torso side to side', 'Tap floor beside hip'], cues: ['Control the rotation', 'Breathe'], mistakes: ['Moving arms only'] },
      { name: 'Ab Wheel Rollout', category: 'bodyweight', primaryMuscles: ['core', 'lats', 'shoulders'], secondaryMuscles: ['triceps'], equipment: ['mat'], difficulty: 'advanced', instructions: ['Kneel with ab wheel on floor', 'Roll forward extending body', 'Pull back with abs'], cues: ['Don\'t let hips drop', 'Tight core throughout'], mistakes: ['Going too far too fast'] },
      // Cardio / Endurance
      { name: 'Treadmill Run', category: 'cardio', primaryMuscles: ['quads', 'hamstrings', 'calves'], secondaryMuscles: ['glutes', 'core'], equipment: ['cardio-machine'], difficulty: 'beginner', instructions: ['Set speed and incline', 'Run with steady stride', 'Cool down gradually'], cues: ['Land mid-foot', 'Relax shoulders', 'Breathe rhythmically'], mistakes: ['Striding too long', 'Holding rails'] },
      { name: 'Rowing Machine', category: 'cardio', primaryMuscles: ['upper back', 'hamstrings', 'glutes', 'quads'], secondaryMuscles: ['core', 'biceps', 'shoulders'], equipment: ['cardio-machine'], difficulty: 'beginner', instructions: ['Sit with feet strapped, grip handle', 'Drive with legs, lean back, pull to chest', 'Reverse: arms forward, hinge, slide'], cues: ['Legs drive first', '1:2 ratio drive/recovery'], mistakes: ['Pulling with arms first'] },
      { name: 'Assault Bike', category: 'cardio', primaryMuscles: ['quads', 'glutes', 'core', 'shoulders'], secondaryMuscles: ['triceps', 'hamstrings'], equipment: ['cardio-machine'], difficulty: 'intermediate', instructions: ['Pedal with arms and legs', 'Maintain steady pace or sprint', 'Monitor calories/RPM'], cues: ['Push and pull both handles'], mistakes: ['Slowing leg pace'] },
      { name: 'Jump Rope', category: 'cardio', primaryMuscles: ['calves', 'quads', 'shoulders'], secondaryMuscles: ['core', 'forearms'], equipment: ['none'], difficulty: 'beginner', instructions: ['Hold handles at hip height', 'Jump with soft knees', 'Swing rope with wrists'], cues: ['Land softly', 'Wrist motion only'], mistakes: ['Double jumping', 'Arms too wide'] },
      // Plyometrics / Athletic
      { name: 'Box Jump', category: 'plyo', primaryMuscles: ['quads', 'glutes', 'calves'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['box'], difficulty: 'intermediate', instructions: ['Stand facing box', 'Slight dip and explode up', 'Land softly on box, stand tall'], cues: ['Step down, not jump down', 'Full hip extension'], mistakes: ['Creeping before jump'] },
      { name: 'Burpee', category: 'bodyweight', primaryMuscles: ['chest', 'quads', 'core', 'shoulders'], secondaryMuscles: ['triceps', 'hamstrings'], equipment: ['none'], difficulty: 'beginner', instructions: ['From standing, drop to squat', 'Kick feet back to plank', 'Do a push-up', 'Jump feet forward, leap up'], cues: ['Land softly', 'Keep core tight'], mistakes: ['Sagging in plank'] },
      { name: 'Broad Jump', category: 'plyo', primaryMuscles: ['quads', 'glutes', 'hamstrings'], secondaryMuscles: ['calves', 'core'], equipment: ['none'], difficulty: 'intermediate', instructions: ['Slight squat, swing arms back', 'Explode forward as far as possible', 'Land softly and hold'], cues: ['Land on whole foot', 'Stick the landing'], mistakes: ['Falling forward'] },
      { name: 'Kettlebell Swing', category: 'resistance', primaryMuscles: ['glutes', 'hamstrings', 'core'], secondaryMuscles: ['lower back', 'shoulders'], equipment: ['kettlebell'], difficulty: 'intermediate', instructions: ['Stance wider than hip-width', 'Hinge back, kettlebell between legs', 'Thrust hips forward to swing to chest height'], cues: ['Hip hinge, not squat', 'Power comes from hips'], mistakes: ['Squatting the swing', 'Arms lifting the weight'] },
      { name: 'Medicine Ball Slam', category: 'plyo', primaryMuscles: ['core', 'shoulders', 'quads'], secondaryMuscles: ['triceps', 'lats'], equipment: ['medicine-ball'], difficulty: 'beginner', instructions: ['Hold ball overhead', 'Slam it down as hard as possible in front', 'Catch on bounce'], cues: ['Use whole body', 'Slam, don\'t throw'], mistakes: ['Just dropping the ball'] },
      { name: 'Mountain Climber', category: 'bodyweight', primaryMuscles: ['core', 'hip flexors', 'shoulders'], secondaryMuscles: ['quads', 'glutes'], equipment: ['none'], difficulty: 'beginner', instructions: ['Start in plank', 'Drive knees alternately toward chest', 'Maintain pace'], cues: ['Flat back', 'Keep hips low'], mistakes: ['Bouncing hips up'] },
      // Mobility
      { name: 'World\'s Greatest Stretch', category: 'mobility', primaryMuscles: ['hips', 'thoracic spine', 'hamstrings'], secondaryMuscles: ['back', 'shoulders'], equipment: ['mat'], difficulty: 'beginner', instructions: ['From lunge position', 'Drop back knee, same-side hand on floor', 'Rotate torso open, reach arm up', 'Hold and breathe'], cues: ['Move slowly', 'Breathe into rotation'], mistakes: ['Rushing the stretch'] },
      { name: 'Cat-Cow', category: 'mobility', primaryMuscles: ['spine', 'core'], secondaryMuscles: ['back', 'neck'], equipment: ['mat'], difficulty: 'beginner', instructions: ['On hands and knees', 'Inhale, drop belly, lift head (cow)', 'Exhale, round back, tuck chin (cat)'], cues: ['Move from tailbone to head'], mistakes: ['Only using neck'] },
      { name: 'Child\'s Pose', category: 'mobility', primaryMuscles: ['lats', 'lower back', 'hips'], secondaryMuscles: ['shoulders'], equipment: ['mat'], difficulty: 'beginner', instructions: ['Kneel then sit back on heels', 'Extend arms forward on floor', 'Rest forehead on floor', 'Breathe'], cues: ['Widen knees for belly space'], mistakes: ['Holding tension'] },
      { name: 'Figure-4 Stretch (Piriformis)', category: 'mobility', primaryMuscles: ['glutes', 'piriformis', 'hips'], secondaryMuscles: [], equipment: ['mat'], difficulty: 'beginner', instructions: ['Lie on back, knees bent', 'Cross one ankle over opposite knee', 'Pull the bottom leg toward chest'], cues: ['Keep head and shoulders relaxed'], mistakes: ['Pulling too hard'] },
      { name: '90/90 Hip Stretch', category: 'mobility', primaryMuscles: ['hips', 'glutes'], secondaryMuscles: [], equipment: ['mat'], difficulty: 'beginner', instructions: ['Sit with front leg bent 90° external, back leg 90° internal', 'Lean forward over front leg', 'Switch sides'], cues: ['Keep both sit bones on floor'], mistakes: ['Rounding the back'] },
      { name: 'Thoracic Spine Rotation', category: 'mobility', primaryMuscles: ['thoracic spine', 'mid-back'], secondaryMuscles: ['shoulders'], equipment: ['mat'], difficulty: 'beginner', instructions: ['Side-lying with knees bent, arms extended', 'Rotate top arm open to floor behind', 'Follow hand with eyes'], cues: ['Keep lower body still', 'Breathe into rotation'], mistakes: ['Moving from lower back'] },
      // Hyrox / Functional Fitness
      { name: 'Wall Ball', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'shoulders', 'core'], secondaryMuscles: ['triceps', 'calves'], equipment: ['medicine-ball'], difficulty: 'intermediate', instructions: ['Hold ball at chest, squat down', 'Explode up and throw ball to target', 'Catch and flow into next rep'], cues: ['Ball and chest move together', 'Hit the target'], mistakes: ['Arms throwing without legs'] },
      { name: 'Sled Push', category: 'resistance', primaryMuscles: ['quads', 'glutes', 'calves', 'core'], secondaryMuscles: ['hamstrings', 'shoulders'], equipment: ['sled'], difficulty: 'intermediate', instructions: ['Lean into sled handles', 'Drive with short powerful steps', 'Keep back flat'], cues: ['Short steps', 'Stay low'], mistakes: ['Rounding back'] },
      { name: 'Sled Pull', category: 'resistance', primaryMuscles: ['upper back', 'hamstrings', 'glutes', 'core'], secondaryMuscles: ['biceps', 'forearms'], equipment: ['sled'], difficulty: 'intermediate', instructions: ['Face away from sled', 'Grip rope, walk forward, drag sled behind', 'Maintain tension'], cues: ['Chest up', 'Long strides'], mistakes: ['Letting rope slack'] },
      { name: 'Farmer\'s Carry', category: 'resistance', primaryMuscles: ['core', 'forearms', 'traps', 'glutes'], secondaryMuscles: ['hamstrings', 'shoulders'], equipment: ['dumbbells', 'kettlebell'], difficulty: 'beginner', instructions: ['Hold heavy weight at sides', 'Walk with upright posture', 'Take controlled steps'], cues: ['Stand tall', 'Breath rhythm', 'Squeeze core'], mistakes: ['Leaning to one side'] },
      { name: 'Battle Ropes', category: 'cardio', primaryMuscles: ['shoulders', 'arms', 'core'], secondaryMuscles: ['back', 'legs'], equipment: ['battle-ropes'], difficulty: 'beginner', instructions: ['Stand with feet shoulder-width', 'Alternate slamming ropes', 'Or double-arm slams'], cues: ['Slight squat stance', 'Use whole body'], mistakes: ['Only using arms'] },
      { name: 'Sandbag Shoulder', category: 'resistance', primaryMuscles: ['shoulders', 'core', 'glutes', 'quads'], secondaryMuscles: ['upper back', 'hamstrings'], equipment: ['medicine-ball'], difficulty: 'intermediate', instructions: ['Squat to pick up sandbag', 'Clean it to one shoulder', 'Stand tall, walk or hold'], cues: ['Use legs to lift', 'Tight core'], mistakes: ['Round back pickup'] },
      { name: 'Prowler Sprint', category: 'cardio', primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves'], secondaryMuscles: ['core', 'shoulders'], equipment: ['sled'], difficulty: 'advanced', instructions: ['Load sled, grip handles', 'Sprint pushing sled for distance', 'Control stop'], cues: ['Drive knees', 'Stay low'], mistakes: ['Narrow stance'] },
    ])
    .returning({ id: s.exercises.id, name: s.exercises.name });

  console.log(`✅ ${exercises.length} exercises seeded`);

  // ─── EXERCISE ALTERNATIVES ───
  const exMap = new Map(exercises.map((e) => [e.name, e.id]));
  await db.insert(s.exerciseAlternatives).values([
    { exerciseId: exMap.get('Barbell Bench Press')!, alternativeId: exMap.get('Dumbbell Bench Press')! },
    { exerciseId: exMap.get('Barbell Bench Press')!, alternativeId: exMap.get('Push-Up')! },
    { exerciseId: exMap.get('Pull-Up')!, alternativeId: exMap.get('Lat Pulldown')! },
    { exerciseId: exMap.get('Barbell Deadlift')!, alternativeId: exMap.get('Romanian Deadlift (RDL)')! },
    { exerciseId: exMap.get('Barbell Back Squat')!, alternativeId: exMap.get('Front Squat')! },
    { exerciseId: exMap.get('Barbell Back Squat')!, alternativeId: exMap.get('Goblet Squat')! },
    { exerciseId: exMap.get('Overhead Press (OHP)')!, alternativeId: exMap.get('Dumbbell Shoulder Press')! },
    { exerciseId: exMap.get('Dumbbell Row')!, alternativeId: exMap.get('Seated Cable Row')! },
  ]);
  console.log('✅ Alternatives seeded');

  // ─── PLANS ───
  const planData = [
    { category: 'mobility', title: 'Foundation Mobility', description: 'Daily mobility routine to improve range of motion and reduce injury risk.', durationWeeks: 4, daysPerWeek: 5, difficulty: 'beginner', equipment: ['mat', 'foam-roller'] },
    { category: 'strength', title: 'Starting Strength', description: 'Classic full-body linear progression for building foundational strength.', durationWeeks: 8, daysPerWeek: 3, difficulty: 'beginner', equipment: ['barbell', 'bench', 'squat-rack'] },
    { category: 'hypertrophy', title: 'Push Pull Legs (PPL)', description: 'Classic 6-day bodybuilding split for maximum muscle growth.', durationWeeks: 8, daysPerWeek: 6, difficulty: 'intermediate', equipment: ['barbell', 'dumbbells', 'cable-machine', 'bench', 'squat-rack'] },
    { category: 'powerlifting', title: 'Powerlifting Peaking - 12 Weeks', description: 'Squat, bench, deadlift peaking program with percentage-based training.', durationWeeks: 12, daysPerWeek: 4, difficulty: 'advanced', equipment: ['barbell', 'bench', 'squat-rack'] },
    { category: 'hyrox', title: 'Hyrox Prep - 8 Weeks', description: 'Specific preparation for Hyrox race: runs alternating with functional stations.', durationWeeks: 8, daysPerWeek: 5, difficulty: 'intermediate', equipment: ['dumbbells', 'sled', 'medicine-ball', 'cardio-machine', 'pull-up-bar', 'kettlebell'] },
    { category: 'endurance', title: 'Couch to 5K', description: 'Gradual running program from zero to completing a 5K.', durationWeeks: 8, daysPerWeek: 3, difficulty: 'beginner', equipment: ['none'] },
    { category: 'athletic', title: 'Athletic Performance Foundation', description: 'Build speed, power, and agility for field sports.', durationWeeks: 8, daysPerWeek: 4, difficulty: 'intermediate', equipment: ['dumbbells', 'box', 'medicine-ball', 'sled'] },
    { category: 'conditioning', title: 'Metcon Master', description: 'High-intensity metabolic conditioning for work capacity.', durationWeeks: 6, daysPerWeek: 5, difficulty: 'intermediate', equipment: ['dumbbells', 'kettlebell', 'cardio-machine', 'medicine-ball'] },
    { category: 'weightloss', title: 'Fat Loss Circuit', description: 'Circuit-based training combining strength and cardio for maximum calorie burn.', durationWeeks: 6, daysPerWeek: 4, difficulty: 'beginner', equipment: ['dumbbells', 'kettlebell', 'mat', 'resistance-bands'] },
  ];

  // Seed plans with minimal structure (demonstrating the plan system without thousands of inserts)
  // Full detailed plan seeding happens via admin CMS in production
  let totalBlockExercises = 0;
  for (const p of planData) {
    const [plan] = await db.insert(s.plans).values(p).returning({ id: s.plans.id });

    // Create just 1 week per plan for demonstration
    const [week] = await db.insert(s.planWeeks).values({ planId: plan.id, weekNumber: 1 }).returning({ id: s.planWeeks.id });

    // Create days: training days + rest days
    const actualDays: { weekId: string; dayNumber: number; isRestDay: boolean }[] = [];
    let daysAssigned = 0;
    for (let d = 1; d <= 7; d++) {
      const isRestDay = daysAssigned >= p.daysPerWeek;
      actualDays.push({ weekId: week.id, dayNumber: d, isRestDay });
      if (!isRestDay) daysAssigned++;
    }

    const createdDays = await db.insert(s.planDays).values(actualDays).returning({ id: s.planDays.id, dayNumber: s.planDays.dayNumber });

    const blockConfigs = getBlockConfigs(p.category, p.difficulty);
    for (const day of createdDays) {
      if (actualDays[day.dayNumber - 1]?.isRestDay) continue;

      let blockOrder = 0;
      for (const bc of blockConfigs) {
        const [block] = await db.insert(s.planBlocks)
          .values({ dayId: day.id, blockType: bc.type, sortOrder: blockOrder++ })
          .returning({ id: s.planBlocks.id });

        const exerciseInserts = bc.exercises
          .map((exName, i) => {
            const exId = exMap.get(exName);
            return exId ? {
              blockId: block.id,
              exerciseId: exId,
              sortOrder: i,
              sets: bc.sets,
              repsScheme: bc.repsScheme,
              loadScheme: bc.loadScheme,
              targetLoad: bc.targetLoad,
              restSec: bc.restSec,
              tempo: '3010',
            } : null;
          })
          .filter(Boolean);

        if (exerciseInserts.length > 0) {
          await db.insert(s.blockExercises).values(exerciseInserts);
          totalBlockExercises += exerciseInserts.length;
        }
      }
    }

    // Create remaining weeks (just the week records, no blocks for now)
    for (let w = 2; w <= p.durationWeeks; w++) {
      await db.insert(s.planWeeks).values({ planId: plan.id, weekNumber: w });
      // Days/blocks can be copied by the frontend when user starts a new week
    }
  }

  console.log(`✅ ${planData.length} plans seeded with ${totalBlockExercises} block exercises (week 1 detailed, weeks 2-${Math.max(...planData.map(p => p.durationWeeks))} structure only)`);
  console.log('🌱 Seeding complete!');
}

function getBlockConfigs(category: string, difficulty: string) {
  // Return block configurations based on plan category
  switch (category) {
    case 'mobility':
      return [
        { type: 'warmup', exercises: ['Cat-Cow', 'Child\'s Pose'], sets: 2, repsScheme: '10 each', loadScheme: 'bodyweight', targetLoad: null, restSec: 30 },
        { type: 'main', exercises: ['World\'s Greatest Stretch', '90/90 Hip Stretch', 'Figure-4 Stretch (Piriformis)', 'Thoracic Spine Rotation'], sets: 3, repsScheme: '30s each side', loadScheme: 'bodyweight', targetLoad: null, restSec: 30 },
        { type: 'cooldown', exercises: ['Dead Hang'], sets: 2, repsScheme: '30s', loadScheme: 'bodyweight', targetLoad: null, restSec: 30 },
      ];
    case 'strength':
    case 'powerlifting':
      return [
        { type: 'warmup', exercises: ['Cat-Cow', 'World\'s Greatest Stretch', 'Glute Bridge'], sets: 2, repsScheme: '10', loadScheme: 'bodyweight', targetLoad: null, restSec: 60 },
        { type: 'main', exercises: difficulty === 'beginner' ? ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Deadlift'] : ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Overhead Press (OHP)'], sets: difficulty === 'beginner' ? 3 : 4, repsScheme: '5', loadScheme: 'percentage', targetLoad: '80% 1RM', restSec: 180 },
        { type: 'accessory', exercises: ['Dumbbell Row', 'Face Pull', 'Dumbbell Curl', 'Tricep Pushdown'], sets: 3, repsScheme: '10-12', loadScheme: 'rpe', targetLoad: 'RPE 8', restSec: 90 },
      ];
    case 'hypertrophy':
      return [
        { type: 'warmup', exercises: ['Cat-Cow', 'World\'s Greatest Stretch', 'Glute Bridge'], sets: 2, repsScheme: '10', loadScheme: 'bodyweight', targetLoad: null, restSec: 45 },
        { type: 'main', exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Fly'], sets: 4, repsScheme: '8-12', loadScheme: 'rpe', targetLoad: 'RPE 8', restSec: 90 },
        { type: 'accessory', exercises: ['Lateral Raise', 'Tricep Pushdown', 'Dumbbell Curl'], sets: 3, repsScheme: '12-15', loadScheme: 'rpe', targetLoad: 'RPE 9', restSec: 60 },
      ];
    case 'hyrox':
      return [
        { type: 'warmup', exercises: ['Cat-Cow', 'World\'s Greatest Stretch', 'Jump Rope'], sets: 1, repsScheme: '5 min', loadScheme: 'bodyweight', targetLoad: null, restSec: 60 },
        { type: 'main', exercises: ['Treadmill Run', 'Wall Ball', 'Sled Push', 'Sled Pull', 'Farmer\'s Carry'], sets: 3, repsScheme: '400m run / 20 reps / 30m push', loadScheme: 'rpe', targetLoad: 'RPE 8', restSec: 120 },
        { type: 'finisher', exercises: ['Burpee', 'Kettlebell Swing', 'Medicine Ball Slam'], sets: 3, repsScheme: '10 each', loadScheme: 'rpe', targetLoad: 'RPE 9', restSec: 60 },
      ];
    case 'endurance':
      return [
        { type: 'warmup', exercises: ['Dead Hang', 'Cat-Cow', 'World\'s Greatest Stretch'], sets: 1, repsScheme: '5 min', loadScheme: 'bodyweight', targetLoad: null, restSec: 30 },
        { type: 'main', exercises: ['Treadmill Run'], sets: 1, repsScheme: '30 min', loadScheme: 'rpe', targetLoad: 'Zone 2 HR', restSec: 0 },
        { type: 'cooldown', exercises: ['Child\'s Pose', 'Figure-4 Stretch (Piriformis)'], sets: 2, repsScheme: '30s', loadScheme: 'bodyweight', targetLoad: null, restSec: 0 },
      ];
    case 'athletic':
      return [
        { type: 'warmup', exercises: ['World\'s Greatest Stretch', 'Cat-Cow', 'Jump Rope'], sets: 1, repsScheme: '5 min', loadScheme: 'bodyweight', targetLoad: null, restSec: 60 },
        { type: 'main', exercises: ['Box Jump', 'Broad Jump', 'Kettlebell Swing', 'Medicine Ball Slam'], sets: 4, repsScheme: '5 each', loadScheme: 'rpe', targetLoad: 'Max effort', restSec: 120 },
        { type: 'finisher', exercises: ['Sled Push', 'Battle Ropes'], sets: 3, repsScheme: '20m / 30s', loadScheme: 'rpe', targetLoad: 'RPE 9', restSec: 90 },
      ];
    case 'conditioning':
      return [
        { type: 'warmup', exercises: ['Jump Rope', 'Cat-Cow', 'Mountain Climber'], sets: 1, repsScheme: '3 min', loadScheme: 'bodyweight', targetLoad: null, restSec: 60 },
        { type: 'main', exercises: ['Kettlebell Swing', 'Burpee', 'Box Jump', 'Rowing Machine'], sets: difficulty === 'intermediate' ? 3 : 4, repsScheme: 'AMRAP 5 min', loadScheme: 'rpe', targetLoad: 'Max effort', restSec: 180 },
        { type: 'finisher', exercises: ['Medicine Ball Slam', 'Battle Ropes'], sets: 3, repsScheme: '30s on / 30s off', loadScheme: 'rpe', targetLoad: 'RPE 10', restSec: 60 },
      ];
    case 'weightloss':
      return [
        { type: 'warmup', exercises: ['Jump Rope', 'Mountain Climber', 'Cat-Cow'], sets: 1, repsScheme: '3 min', loadScheme: 'bodyweight', targetLoad: null, restSec: 30 },
        { type: 'main', exercises: ['Goblet Squat', 'Push-Up', 'Dumbbell Row', 'Kettlebell Swing', 'Walking Lunge', 'Plank'], sets: 3, repsScheme: '12-15', loadScheme: 'rpe', targetLoad: 'RPE 7', restSec: 30 },
        { type: 'finisher', exercises: ['Burpee', 'Mountain Climber', 'Jump Rope'], sets: 3, repsScheme: '30s each', loadScheme: 'rpe', targetLoad: 'RPE 8', restSec: 0 },
      ];
    default:
      return [
        { type: 'warmup', exercises: ['Cat-Cow', 'Push-Up'], sets: 2, repsScheme: '10', loadScheme: 'bodyweight', targetLoad: null, restSec: 45 },
        { type: 'main', exercises: ['Barbell Bench Press', 'Dumbbell Row', 'Walking Lunge'], sets: 3, repsScheme: '10', loadScheme: 'rpe', targetLoad: 'RPE 8', restSec: 90 },
      ];
  }
}

seed().catch(console.error);
