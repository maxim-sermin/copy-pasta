ALTER TABLE public."comments" DROP CONSTRAINT recipe_comment_fk;
ALTER TABLE public."comments" DROP CONSTRAINT user_comment_fk;

ALTER TABLE public.label_recipe_map DROP CONSTRAINT label_labelrecipemap_fk;
ALTER TABLE public.label_recipe_map DROP CONSTRAINT recipe_labelrecipemap_fk;

ALTER TABLE public.likes DROP CONSTRAINT recipe_like_fk;
ALTER TABLE public.likes DROP CONSTRAINT user_like_fk;

ALTER TABLE public.pics DROP CONSTRAINT recipe_pic_fk;
ALTER TABLE public.pics DROP CONSTRAINT user_pics_fk;

ALTER TABLE public.quantity DROP CONSTRAINT ingredient_quantity_fk;
ALTER TABLE public.quantity DROP CONSTRAINT recipe_quantity_fk;
ALTER TABLE public.quantity DROP CONSTRAINT unit_quantity_fk;

ALTER TABLE public.recipe DROP CONSTRAINT recipe_user_created_fk;

ALTER TABLE public.steps DROP CONSTRAINT recipe_step_fk;

ALTER TABLE public.users DROP CONSTRAINT pic_users_fk;