package com.mnm.copypastabackend.api;

import java.io.IOException;
import java.io.InputStream;
import java.security.Principal;
import java.util.List;
import java.util.Optional;

import javax.annotation.PostConstruct;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnm.copypastabackend.entities.Pic;
import com.mnm.copypastabackend.entities.User;
import com.mnm.copypastabackend.repositories.PicRepository;
import com.mnm.copypastabackend.repositories.UserRepository;
import com.mnm.copypastabackend.security.JwtTokenUtil;
import com.mnm.copypastabackend.services.StorageService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(path = "/")
@Api(value = "Endpoint for managing user information in Copy Pasta")
public class UsersEndpoint {

    @Value("${CREATE_INITIAL_USER:false}")
    private boolean createInitialUser;

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(UsersEndpoint.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final StorageService storageService;
    private final PicRepository picRepository;

    public UsersEndpoint(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil, StorageService storageService, PicRepository picRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenUtil = jwtTokenUtil;
        this.storageService = storageService;
        this.picRepository = picRepository;
    }

    @PostConstruct
    public void createInitialUser() {
        if (createInitialUser && userRepository.findAll().isEmpty()) { // strictly speaking not necessary, leaving for clarity of intent
            String startCreds = "initialChangeMe";
            User initialUser = new User();
            initialUser.setName(startCreds);
            initialUser.setPassword(startCreds);
            saveNewUser(initialUser);
        }
    }

    @ApiOperation("Login with token")
    @PostMapping("/login")
    public void swaggerLogin(@RequestBody UserLogin userLogin) {
        throw new IllegalStateException("This method shouldn't be called, it is only required for Swagger. It's implemented by Spring Security filters.");
    }

    @ApiOperation("Logout")
    @PostMapping("/logout")
    public void swaggerLogout() {
        throw new IllegalStateException("This method shouldn't be called, it is only required for Swagger. It's implemented by Spring Security filters.");
    }

    @ApiOperation("Register new user account")
    @PostMapping("register")
    public ResponseEntity<String> registerUser(@RequestBody @Valid User newUser) {
        Optional<User> saved = saveNewUser(newUser);

        if (saved.isEmpty()) {
            return new ResponseEntity<>(String.format("Username '%s' is already taken", newUser.getName()), HttpStatus.CONFLICT);
        }

        return ResponseEntity.ok().build();
    }

    private Optional<User> saveNewUser(User newUser) {
        Optional<User> user = userRepository.findByName(newUser.getName());

        if (user.isPresent()) {
            logger.warn("Tried to register user with name {} which already exists", newUser.getName());
            return Optional.empty();
        }

        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setPicOffsetX(50);
        newUser.setPicOffsetY(50);

        return Optional.of(userRepository.save(newUser));
    }

    @GetMapping("checkSession")
    public ResponseEntity<String> checkSession() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("username")
    public ResponseEntity<User> usernameAndId(@ApiParam(hidden = true) Principal principal) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        User user = userOptional.get();

        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @PutMapping(value = "/username", produces = "application/json")
    public void updateUsername(@ApiParam(hidden = true) Principal principal, @RequestBody String newUsername, HttpServletResponse res)
            throws IOException {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            res.setStatus(404);
            return;
        }

        Optional<User> checkIfNameFree = userRepository.findByName(newUsername);
        if (checkIfNameFree.isPresent()) {
            res.setStatus(409); // conflict
            return;
        }

        User user = userOptional.get();

        user.setName(newUsername);
        User saved = userRepository.save(user);

        // we actually need to issue a new JWT with tne new name as the subject
        jwtTokenUtil.addAccessAndRefreshCookie(res, saved.getName());
        String jsonResponse = new ObjectMapper().writeValueAsString(saved);
        res.setContentType("application/json");
        res.getWriter().write(jsonResponse);
        res.setStatus(200);
    }

    @PutMapping("/password")
    public ResponseEntity<String> updatePassword(@ApiParam(hidden = true) Principal principal, @RequestBody String newPassword) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Successfully updated username");
    }

    @DeleteMapping("")
    public ResponseEntity<String> deleteAccount(@ApiParam(hidden = true) Principal principal) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();

        userRepository.delete(user);

        return ResponseEntity.ok("Successfully deleted account");
    }

    @DeleteMapping("/picture")
    public ResponseEntity<String> deleteProfilePicture(@ApiParam(hidden = true) Principal principal) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();

        if (user.getPic() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Pic oldPic = user.getPic();
        user.setPic(null);
        userRepository.save(user);
        deleteProfilePicture(user, oldPic);

        return ResponseEntity.ok("Successfully deleted profile picture");
    }

    @PostMapping("/picture")
    public ResponseEntity<String> handleProfilePictureUpload(@RequestParam("file") MultipartFile file, @RequestParam("rotation") Integer rotation, @RequestParam("offsetx") Integer offsetX, @RequestParam("offsety") Integer offsetY, @ApiParam(hidden = true) Principal principal) {
        Optional<User> userOptional = userRepository.findByName(principal.getName());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        User user = userOptional.get();

        try {
            if (attachPicToUser(file.getInputStream(), file.getSize(), file.getOriginalFilename(), user, rotation,offsetX, offsetY)) {
                return new ResponseEntity<>(HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAllByOrderByIdDesc());
    }

    // allow to use a refresh token to get new tokens
    @PostMapping(value = "/refresh")
    public void refreshSession(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("REFRESH")) {
                    String refreshToken = cookie.getValue();
                    if (!jwtTokenUtil.isTokenExpired(refreshToken)) {
                        Optional<String> subject = jwtTokenUtil.getSubjectFromToken(refreshToken);
                        if (subject.isPresent()) {
                            jwtTokenUtil.addAccessAndRefreshCookie(response, subject.get());
                            response.setStatus(200);
                            return;
                        }
                    }
                }
            }
        }

        response.setStatus(401);
    }

    private boolean attachPicToUser(InputStream inputStream, long size, String originalFileName, User user, Integer rotation, Integer offsetX, Integer offsetY) {
        String internalName;
        try {
            internalName = storageService.storeFile(inputStream, size);
        } catch (IOException e) {
            logger.error("Error while writing picture {} of user with id {} to disk", originalFileName, user.getId(), e);
            return false;
        }

        Pic newPic = new Pic();
        newPic.setInternalUUID(internalName);
        newPic.setName(originalFileName);
        newPic.setRotation(rotation);
        picRepository.save(newPic);

        Pic oldPic = user.getPic();
        user.setPic(newPic);
        user.setPicOffsetX(offsetX);
        user.setPicOffsetY(offsetY);
        userRepository.save(user);

        if (oldPic != null) {
            deleteProfilePicture(user, oldPic);
        }

        return true;
    }

    private void deleteProfilePicture(User user, Pic oldPic) {
        try {
            storageService.deleteFile(oldPic.getInternalUUID());
        } catch (IOException e) {
            logger.error("Could not delete profile picture with UUID {} of user with id {} from storage", oldPic.getInternalUUID(), user
                    .getId());
        }
        picRepository.delete(oldPic);
    }

    public class UserLogin {
        public String name;
        public String password;
    }
}
