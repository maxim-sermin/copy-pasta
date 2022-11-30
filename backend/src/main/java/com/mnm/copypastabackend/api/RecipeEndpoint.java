package com.mnm.copypastabackend.api;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.mnm.copypastabackend.entities.Comment;
import com.mnm.copypastabackend.entities.Like;
import com.mnm.copypastabackend.entities.Pic;
import com.mnm.copypastabackend.entities.Recipe;
import com.mnm.copypastabackend.entities.User;
import com.mnm.copypastabackend.repositories.CommentRepository;
import com.mnm.copypastabackend.repositories.LikeRepository;
import com.mnm.copypastabackend.repositories.RecipeRepository;
import com.mnm.copypastabackend.repositories.UserRepository;
import com.mnm.copypastabackend.services.RecipeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(path = "/recipes")
@Api(value = "Endpoint for interacting with recipes")
public class RecipeEndpoint {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(RecipeEndpoint.class);

    @Autowired
    private RecipeRepository recipeRepository;
    @Autowired
    private RecipeService recipeService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private LikeRepository likeRepository;
    @Autowired
    private CommentRepository commentRepository;

    @GetMapping("/")
    public ResponseEntity<Page<Recipe>> getAllRecipes(@RequestParam(required = false) String recipeName, @RequestParam(required = false) List<String> labelNames, @RequestParam(required = false) List<String> ingredientNames, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "false") boolean sortByLikes, @RequestParam(defaultValue = "false") boolean sortAscending) {
        Pageable paging = PageRequest.of(page, size, getSort(sortByLikes, sortAscending));

        Page<Recipe> recipePage;
        boolean nameEmpty = recipeName == null || recipeName.trim().isEmpty();
        boolean labelsEmpty = labelNames == null || labelNames.size() < 1;
        boolean ingredientsEmpty = ingredientNames == null || ingredientNames.size() < 1;

        if (nameEmpty && labelsEmpty && ingredientsEmpty) { // no filters given
            recipePage = recipeRepository.findAllSort(paging);
        } else {
            recipePage = recipeRepository.filterRecipes(textToLike(recipeName), ingredientNames, labelNames, paging);
        }

        return ResponseEntity.ok(recipePage);
    }

    @GetMapping("/names")
    public ResponseEntity<List<String>> getRecipeNamesFilter(@RequestParam(required = false) String recipeName) {
        return ResponseEntity.ok(recipeRepository.getRecipeNames(textToLike(recipeName)));
    }

    @GetMapping("/all_names")
    public ResponseEntity<List<String>> getAllRecipeNames() {
        return ResponseEntity.ok(recipeRepository.getAllRecipeNames());
    }

    private String textToLike(String recipeName) {
        if (recipeName != null) {
            recipeName = "%" + recipeName + "%";
        } else {
            recipeName = "";
        }
        return recipeName;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getSingleById(@PathVariable("id") Long id) {
        Optional<Recipe> recipeOptional = recipeRepository.findById(id);
        if (recipeOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok(recipeOptional.get());
    }

    @PostMapping("/import")
    public ResponseEntity<String> importRecipes(@RequestBody List<Recipe> newRecipes){
        int importCount = recipeRepository.saveAll(newRecipes).size();
        return ResponseEntity.ok("imported " + importCount + " entries");
    }

    @PostMapping("/add")
    public ResponseEntity<Long> addRecipe(@ApiParam(hidden = true) Principal principal, @RequestBody Recipe newRecipe){
        List<Recipe> alreadyExists = recipeRepository.findByNameIgnoreCase(newRecipe.getName());
        if (!alreadyExists.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        Optional<User> user = userRepository.findByName(principal.getName());

        if (user.isEmpty()) {
            logger.warn("Got a request to save a new recipe from user '{}' which does not exist anymore", principal.getName());
        } else {
            newRecipe.setCreatedBy(user.get());
        }

        return ResponseEntity.ok(recipeService.saveNewToDb(newRecipe).getId());
    }

    @PutMapping("/update")
    public ResponseEntity<Long> updateRecipe(@ApiParam(hidden = true) Principal principal, @RequestBody Recipe changedRecipe){
        Optional<Recipe> recipeOptional = recipeRepository.findById(changedRecipe.getId());

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipeFromDB = recipeOptional.get();
        Optional<User> user = userRepository.findByName(principal.getName());

        if (user.isEmpty()) {
            logger.warn("Got a request to update the recipe with id '{}' from user '{}' which does not exist anymore", recipeFromDB.getId(), principal.getName());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        // todo if picture upload/deletion should become a separate thing at some point, add check back in (like in delete recipe)
        // not checking if user is creator here because than deletion of own pictures in non-own recipe would not work (take the risk)

        if (!recipeFromDB.getName().equals(changedRecipe.getName())) {
            List<Recipe> alreadyExists = recipeRepository.findByNameIgnoreCase(changedRecipe.getName());
            if (!alreadyExists.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.CONFLICT);
            }
        }

        recipeService.saveOrUpdateLabels(changedRecipe, recipeFromDB);
        recipeService.saveOrUpdateQuantities(changedRecipe, recipeFromDB);
        recipeService.saveOrUpdateSteps(changedRecipe, recipeFromDB);

        recipeFromDB.setName(changedRecipe.getName());
        recipeFromDB.setDescription(changedRecipe.getDescription());
        recipeFromDB.setLastModifiedAt(LocalDateTime.now());
        recipeFromDB.setId(changedRecipe.getId());

        Recipe saved = recipeRepository.save(recipeFromDB);


        return ResponseEntity.ok(saved.getId());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteRecipe(@ApiParam(hidden = true) Principal principal, @PathVariable("id") Long id) {
        Optional<Recipe> recipeOptional = recipeRepository.findById(id);

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipe = recipeOptional.get();
        Optional<User> user = userRepository.findByName(principal.getName());

        if (user.isEmpty()) {
            logger.warn("Got a request to delete the recipe with id '{}' from user '{}' which does not exist anymore", recipe.getId(), principal.getName());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        if (recipe.getCreatedBy() != null && !user.get().equals(recipe.getCreatedBy())) {
            logger.warn("Got a request to delete the recipe with id '{}' from user '{}' who is not the creator", recipe.getId(), principal.getName());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        if (recipe.getCreatedBy() != null) {
            Optional<User> userByName = userRepository.findByName(principal.getName());
            if (userByName.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // only the creator may delete the recipe
            if (!recipe.getCreatedBy().equals(userByName.get())) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        }

        for (Pic pic : recipe.getPics()) {
            try {
                recipeService.deleteImage(pic);
            } catch (IOException e) {
                logger.error("Could not delete picture with id '{}' from file system ", pic.getInternalUUID(), e);
            }
        }

        recipeRepository.delete(recipe);

        return ResponseEntity.ok("Successfully deleted");
    }

    @DeleteMapping("/deleteImage/{id}")
    public ResponseEntity<String> deleteImagesFromRecipe(@PathVariable("id") Long id, @RequestBody List<Long> imageIds, @ApiParam(hidden = true) Principal principal) {
        Optional<Recipe> recipeOptional = recipeRepository.findById(id);

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipe = recipeOptional.get();

        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            logger.warn("Got a request to delete images of recipe with id '{}' from user '{}' which does not exist anymore", recipe.getId(), principal.getName());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        User user = userOptional.get();

        int deletedPictures = 0;
        for (Pic pic : recipe.getPics()) {
            if (imageIds.contains(pic.getId())) {
                if (recipe.getCreatedBy() == null || recipe.getCreatedBy().equals(user) || (pic.getUploadedBy() != null && pic.getUploadedBy().equals(user))) {
                    recipeService.deletePictureFromDB(pic);
                    try {
                        recipeService.deleteImage(pic);
                    } catch (IOException e) {
                        logger.error("Could not delete picture with id '{}' from file system ", pic.getInternalUUID(), e);
                    }
                    deletedPictures++;
                } else {
                    logger.warn("User '{}' attempted to delete image with id '{}' which is not allowed, skipping", principal.getName(), pic.getId());
                }
            }
        }

        return ResponseEntity.ok("Successfully deleted " + deletedPictures + " pictures");
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<String> handlePicUpload(@RequestParam("file") MultipartFile file, @RequestParam("rotation") Integer rotation, @PathVariable("id") Long recipeId, @ApiParam(hidden = true) Principal principal) {
        Optional<User> pictureUploaderOptional = userRepository.findByName(principal.getName());

        if (pictureUploaderOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            if (recipeService.attachPicToRecipe(file.getInputStream(), file.getSize(), file.getOriginalFilename(), recipeId, rotation, pictureUploaderOptional.get())) {
                return new ResponseEntity<>(HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}/like")
    public ResponseEntity<String> toggleRecipeLike(@ApiParam(hidden = true) Principal principal, @PathVariable("id") Long id, @RequestParam("doLike") Boolean doLike) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Optional<Recipe> recipeOptional = recipeRepository.findById(id);

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipe = recipeOptional.get();
        User user = userOptional.get();

        Optional<Like> existingLikeOptional = likeRepository.findById(new Like.LikeId(recipe.getId(), user.getId()));
        if (existingLikeOptional.isPresent() && doLike) {
            logger.debug("User '{}' tried to add like to recipe with id '{}' which they already like - rejecting", principal.getName(), id);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        if (existingLikeOptional.isEmpty() && !doLike) {
            logger.debug("User '{}' tried to remove like from recipe with id '{}' which they do not like yet - rejecting", principal.getName(), id);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        if (doLike) { // like
            Like like = new Like();
            like.setId(new Like.LikeId(recipe.getId(), user.getId()));
            likeRepository.save(like);
            recipe.setLikesAmount(recipe.getLikesAmount() + 1);
        } else { // un-like
            likeRepository.delete(existingLikeOptional.get());
            recipe.setLikesAmount(recipe.getLikesAmount() - 1);
        }
        recipeRepository.save(recipe);

        return ResponseEntity.ok("Toggled like");
    }

    @GetMapping("/{id}/like")
    public ResponseEntity<Boolean> doesAlreadyLikeRecipe(@ApiParam(hidden = true) Principal principal, @PathVariable("id") Long id) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Optional<Recipe> recipeOptional = recipeRepository.findById(id);

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipe = recipeOptional.get();
        User user = userOptional.get();

        return ResponseEntity.ok(likeRepository.findById(new Like.LikeId(recipe.getId(), user.getId())).isPresent());
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<Comment> addComment(@ApiParam(hidden = true) Principal principal, @PathVariable("id") Long id, @RequestBody String commentContent) {
        if (commentContent == null || commentContent.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Optional<Recipe> recipeOptional = recipeRepository.findById(id);

        if (recipeOptional.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Recipe recipe = recipeOptional.get();
        User user = userOptional.get();

        Comment comment = new Comment();
        comment.setRecipe(recipe);
        comment.setUser(user);
        comment.setContent(commentContent);
        comment.setCommentTime(LocalDateTime.now());

        Comment savedComment = commentRepository.save(comment);

        recipe.setLastModifiedAt(LocalDateTime.now());
        recipeRepository.save(recipe);

        return ResponseEntity.ok(savedComment);
    }

    @DeleteMapping("/comment/{commentId}")
    public ResponseEntity<String> deleteComment(@ApiParam(hidden = true) Principal principal, @PathVariable("commentId") Long commentId) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Optional<Comment> commentOptional= commentRepository.findById(commentId);

        if (commentOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();
        Comment comment = commentOptional.get();

        if (!user.equals(comment.getUser())) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        commentRepository.delete(comment);

        return ResponseEntity.ok("Comment deleted");
    }

    @PutMapping("/comment/{commentId}")
    public ResponseEntity<String> updateComment(@ApiParam(hidden = true) Principal principal, @PathVariable("commentId") Long commentId, @RequestBody String commentContent) {
        if (commentContent == null || commentContent.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Optional<Comment> commentOptional= commentRepository.findById(commentId);

        if (commentOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();
        Comment comment = commentOptional.get();

        if (!user.equals(comment.getUser())) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        comment.setContent(commentContent);

        commentRepository.save(comment);

        return ResponseEntity.ok("Comment updated");
    }

    private Sort getSort(boolean sortByLikes, boolean sortAscending) {
        Sort sort;
        if (sortByLikes) {
            sort = Sort.by("likesAmount").descending();
        } else {
            sort = Sort.by("lastModifiedAt").descending();
        }
        if (sortAscending) {
            sort = sort.ascending();
        } else {
            sort = sort.descending();
        }
        return sort;
    }
}
